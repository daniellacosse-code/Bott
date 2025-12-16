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
import { spawnGcloud } from "./common/gcloud.ts";
import { log } from "@bott/logger";

const env = Deno.env.get("ENV") ?? "production";

await loadEnv(env);

const projectId = Deno.env.get("GCP_PROJECT_ID");
const serviceName = Deno.env.get("GCP_SERVICE_NAME") ?? `bott-${env}`;
const region = Deno.env.get("GCP_REGION") ?? "us-central1";

if (!projectId) {
  log.error("GCP_PROJECT_ID not found. Please set it in your env file.");
  Deno.exit(1);
}

log.info(`Tailing logs for ${serviceName} in ${projectId}...`);

const process = spawnGcloud([
  "beta", "run", "services", "logs", "tail", serviceName,
  "--project", projectId,
  "--region", region
]);

await process.status;
