/**
 * @license
 * This file is part of Bott.
 *
 * This project is dual-licensed:
 * - Non-commercial use: AGPLv3 (see LICENSE file for full text).
 * - Commercial use: Proprietary License (contact D@nielLaCos.se for details).
 *
 * Copyright (C) 2025 DanielLaCos.se
 */

import { loadEnv } from "./common/env.ts";
import { runGcloud, spawnGcloud } from "./common/gcloud.ts";
import { log } from "@bott/logger";

const env = Deno.env.get("ENV") ?? "production";

log.info(`Deploying to environment: ${env}`);

await loadEnv(env);

const projectId = Deno.env.get("GCP_PROJECT_ID");
if (!projectId) {
  log.error("GCP_PROJECT_ID is not set in environment.");
  Deno.exit(1);
}

const serviceName = Deno.env.get("GCP_SERVICE_NAME") ?? `bott-${env}`;
const region = Deno.env.get("GCP_REGION") ?? "us-central1";
const allowUnauthenticated = Deno.env.get("GCP_ALLOW_UNAUTHENTICATED") === "true";

log.info(`Setting up project: ${projectId}`);
try {
  await runGcloud(["config", "set", "project", projectId]);
} catch {
  log.info("Ensuring project exists...");
  try {
    await runGcloud(["projects", "describe", projectId]);
  } catch {
    log.info(`Creating project ${projectId}...`);
    await runGcloud(["projects", "create", projectId]);
  }
}

const APIS = [
  "aiplatform.googleapis.com",
  "storage.googleapis.com",
  "run.googleapis.com",
  "artifactregistry.googleapis.com",
  "cloudbuild.googleapis.com",
];

log.info("Enabling APIs...");
for (const api of APIS) {
  log.info(`Enabling ${api}...`);
  await runGcloud(["services", "enable", api]);
}

log.info("Configuring IAM...");
const projectNumber = await runGcloud(["projects", "describe", projectId, "--format=value(projectNumber)"]);
const serviceAccount = `${projectNumber}@cloudbuild.gserviceaccount.com`;
const roles = [
  "roles/aiplatform.user",
  "roles/storage.objectAdmin"
];

for (const role of roles) {
  log.info(`Adding role ${role} to ${serviceAccount}...`);
  await runGcloud([
    "projects",
    "add-iam-policy-binding",
    projectId,
    `--member=serviceAccount:${serviceAccount}`,
    `--role=${role}`
  ], { exitOnError: false });
}

log.info(`Deploying ${serviceName} to ${region}...`);
const deployArgs = [
  "run", "deploy", serviceName,
  "--source", ".",
  "--region", region,
  "--project", projectId,
  "--platform", "managed",
  "--cpu", "1",
  "--memory", "1.5Gi",
  "--max-instances", "1",
  "--port", "8080",
  "--env-vars-file", `.env.${env}.yml`,
];

if (allowUnauthenticated) {
  deployArgs.push("--allow-unauthenticated");
}

const process = spawnGcloud(deployArgs);
const status = await process.status;

if (status.success) {
  const url = await runGcloud(["run", "services", "describe", serviceName, "--region", region, "--format=value(status.url)"]);
  log.info(`Deployment successful! Service URL: ${url}`);
} else {
  log.error("Deployment failed.");
  Deno.exit(1);
}
