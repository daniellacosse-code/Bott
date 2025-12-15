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
 * @license
 * This file is part of Bott.
 *
 * This project is dual-licensed:
 * - Non-commercial use: AGPLv3 (see LICENSE file for full text).
 * - Commercial use: Proprietary License (contact D@nielLaCos.se for details).
 *
 * Copyright (C) 2025 DanielLaCos.se
 */

import { join, fromFileUrl, dirname } from "@std/path";
import { LOGGER_MAX_CHARACTER_LENGTH, LOGGER_TOPICS } from "@bott/constants";
import { budgetedStringify } from "./budgetedStringify.ts";

// Load logger.sh content
const loggerSh = Deno.readTextFileSync(
  join(dirname(fromFileUrl(import.meta.url)), "logger.sh")
);

// Parse LOGGER_TOPICS environment variable
export const allowedTopics: Set<string> = new Set(LOGGER_TOPICS);

export type Logger = {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  perf(label?: string): void;
};

// Test interception
type LogInterceptor = (level: string, args: unknown[]) => void;
let logInterceptor: LogInterceptor | null = null;

export function setLogInterceptor(interceptor: LogInterceptor | null): void {
  logInterceptor = interceptor;
}

/**
 * Helper function to format log arguments similar to console methods
 */
export function formatArgs(...args: unknown[]): string {
  return budgetedStringify(args, LOGGER_MAX_CHARACTER_LENGTH);
}

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
    args: args.map((arg) => typeof arg === "string" ? arg : formatArgs(arg)),
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

// Map to track performance timers (label -> start time)
const perfTimers = new Map<string, number>();

// Export a logger object that maintains the same API
export const log: Logger = {
  debug(...args: unknown[]): void {
    if (logInterceptor) {
      logInterceptor("debug", args);
      return;
    }
    if (allowedTopics.has("debug")) {
      queueLog("debug_log", ...args);
    }
  },

  info(...args: unknown[]): void {
    if (logInterceptor) {
      logInterceptor("info", args);
      return;
    }
    if (allowedTopics.has("info")) {
      queueLog("info_log", ...args);
    }
  },

  warn(...args: unknown[]): void {
    if (logInterceptor) {
      logInterceptor("warn", args);
      return;
    }
    if (allowedTopics.has("warn")) {
      queueLog("warn_log", ...args);
    }
  },

  error(...args: unknown[]): void {
    if (logInterceptor) {
      logInterceptor("error", args);
      return;
    }
    if (allowedTopics.has("error")) {
      queueLog("error_log", ...args);
    }
  },

  perf(label = "default"): void {
    if (!allowedTopics.has("perf")) {
      return;
    }

    // If timer exists, end it and log elapsed time
    if (perfTimers.has(label)) {
      const startTime = perfTimers.get(label)!;
      const elapsed = performance.now() - startTime;
      perfTimers.delete(label);

      const message = `${label}: ${elapsed.toFixed(2)}ms`;
      if (logInterceptor) {
        logInterceptor("perf", [message]);
      } else {
        queueLog("perf_log", message);
      }
    } else {
      // Start a new timer
      perfTimers.set(label, performance.now());
    }
  },
};
