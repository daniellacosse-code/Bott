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

export async function runGcloud(args: string[], options: { exitOnError?: boolean } = { exitOnError: true }): Promise<string> {
  const command = new Deno.Command("gcloud", {
    args,
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await command.output();
  const output = new TextDecoder().decode(stdout).trim();
  const errorOutput = new TextDecoder().decode(stderr).trim();

  if (code !== 0) {
    console.error(`Error running gcloud ${args.join(" ")}:`);
    console.error(errorOutput);
    if (options.exitOnError) {
      Deno.exit(code);
    }
    throw new Error(`gcloud command failed: ${errorOutput}`);
  }

  return output;
}

export function spawnGcloud(args: string[]) {
  const command = new Deno.Command("gcloud", {
    args,
    stdout: "inherit",
    stderr: "inherit",
  });

  return command.spawn();
}
