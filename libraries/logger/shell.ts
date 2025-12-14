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

/**
 * Shell logger wrapper that calls the bash logging utilities
 * Provides integration between TypeScript and bash log.sh
 */

const SCRIPT_DIR = new URL("../../scripts/utils/log.sh", import.meta.url)
  .pathname;

/**
 * Execute a bash log command
 */
async function execLog(level: string, ...args: unknown[]): Promise<void> {
  const message = args.map((arg) => String(arg)).join(" ");

  // Use separate arguments to avoid shell injection
  const command = new Deno.Command("bash", {
    args: [
      "-c",
      `source "$1" && shift && "log_$2" "$@"`,
      "--",
      SCRIPT_DIR,
      level,
      ...args.map((arg) => String(arg)),
    ],
    stdout: "piped",
    stderr: "piped",
  });

  const { stdout, stderr } = await command.output();

  // Write output to console
  if (stdout.length > 0) {
    await Deno.stdout.write(stdout);
  }
  if (stderr.length > 0) {
    await Deno.stderr.write(stderr);
  }
}

/**
 * Shell logger that wraps bash log.sh functions
 */
export const shellLog = {
  /**
   * Log debug message via bash logger
   */
  debug(...args: unknown[]): Promise<void> {
    return execLog("debug", ...args);
  },

  /**
   * Log info message via bash logger
   */
  info(...args: unknown[]): Promise<void> {
    return execLog("info", ...args);
  },

  /**
   * Log warning message via bash logger
   */
  warn(...args: unknown[]): Promise<void> {
    return execLog("warn", ...args);
  },

  /**
   * Log error message via bash logger
   */
  error(...args: unknown[]): Promise<void> {
    return execLog("error", ...args);
  },
};
