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
 * Provides integration between TypeScript and bash logger.sh
 */

import type { Logger } from "./logging.ts";
import loggerSh from "logger.sh" with { type: "text" };

// Queue for batching log calls
interface LogCall {
  fnName: string;
  args: string[];
}

let logQueue: LogCall[] = [];
let flushTimer: number | null = null;
const BATCH_DELAY_MS = 100; // Batch logs within 100ms window

/**
 * Flush queued log calls
 */
async function flushLogs(): Promise<void> {
  if (logQueue.length === 0) return;

  const batch = logQueue;
  logQueue = [];
  flushTimer = null;

  // Build a single bash script with all log calls
  const script = batch.map((call) => {
    const escapedArgs = call.args.map((arg) =>
      arg.replace(/'/g, "'\\''")
    ).join("' '");
    return `${call.fnName} '${escapedArgs}'`;
  }).join("\n");

  const command = new Deno.Command("bash", {
    args: ["-c", `source /dev/stdin\n${script}`],
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  });

  const process = command.spawn();
  
  // Write the logger script to stdin
  const writer = process.stdin.getWriter();
  await writer.write(new TextEncoder().encode(loggerSh));
  await writer.close();

  const { stdout, stderr } = await process.output();

  // Write output to console
  if (stdout.length > 0) {
    await Deno.stdout.write(stdout);
  }
  if (stderr.length > 0) {
    await Deno.stderr.write(stderr);
  }
}

/**
 * Queue a log call for batch processing
 */
function queueLog(fnName: string, ...args: unknown[]): void {
  logQueue.push({
    fnName,
    args: args.map((arg) => String(arg)),
  });

  // Schedule flush if not already scheduled
  if (flushTimer === null) {
    flushTimer = setTimeout(() => {
      flushLogs().catch((err) => {
        console.error("Failed to flush logs:", err);
      });
    }, BATCH_DELAY_MS);
  }
}

/**
 * Shell logger that wraps bash logger.sh functions and conforms to Logger interface
 * Batches log calls for efficiency
 */
export const shellLog: Logger = {
  /**
   * Log debug message via bash logger
   */
  debug(...args: unknown[]): void {
    queueLog("debug_log", ...args);
  },

  /**
   * Log info message via bash logger
   */
  info(...args: unknown[]): void {
    queueLog("info_log", ...args);
  },

  /**
   * Log warning message via bash logger
   */
  warn(...args: unknown[]): void {
    queueLog("warn_log", ...args);
  },

  /**
   * Log error message via bash logger
   */
  error(...args: unknown[]): void {
    queueLog("error_log", ...args);
  },

  /**
   * Performance logging - uses purple color
   */
  perf(...args: unknown[]): void {
    queueLog("perf_log", ...args);
  },
};
