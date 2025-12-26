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

import { ENV, OUTPUT_ROOT } from "@bott/constants";
import { ensureDirSync } from "@std/fs";
import { join } from "@std/path";

// Generate session ID and timestamp for log file
const SESSION_ID = crypto.randomUUID();
const START_TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-");

const LOG_DIR = join(OUTPUT_ROOT, "logs", "local");
const LOG_FILE = join(LOG_DIR, `${START_TIMESTAMP}_${SESSION_ID}.log`);

// Only enable JSONL logging in local environment
const ENABLE_JSONL = ENV === "local";

if (ENABLE_JSONL) {
  ensureDirSync(LOG_DIR);

  const originalConsole = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  function getCallLocation(): string | undefined {
    try {
      const stack = new Error().stack?.split("\n");
      // Skip first 3 lines: Error message, getCallLocation, writeToLog, console wrapper
      const callerLine = stack?.[4];
      if (callerLine) {
        // Extract file:line:col from stack trace
        const match = callerLine.match(/\((.*):(\d+):(\d+)\)/);
        if (match) {
          const [, file, line, col] = match;
          // Get just the filename, not full path
          const filename = file.split("/").pop() || file;
          return `${filename}:${line}:${col}`;
        }
      }
    } catch (_error) {
      // Silently fail if unable to get stack trace
    }
    return undefined;
  }

  function writeToLog(level: string, ...args: unknown[]) {
    const logEntry: Record<string, unknown> = {
      ts: new Date().toISOString(), // timestamp -> ts
      l: level.charAt(0), // level -> l (d/i/w/e for debug/info/warn/error)
      m: args.map((arg) =>
        // message -> m
        typeof arg === "object" ? JSON.stringify(arg) : String(arg)
      ).join(" "),
    };

    const loc = getCallLocation();
    if (loc) {
      logEntry.c = loc; // call location -> c
    }

    try {
      Deno.writeTextFileSync(
        LOG_FILE,
        JSON.stringify(logEntry) + "\n",
        { append: true },
      );
    } catch (_error) {
      // Silently fail if unable to write to log file
    }
  }

  console.debug = (...args: unknown[]) => {
    originalConsole.debug(...args);
    writeToLog("debug", ...args);
  };

  console.info = (...args: unknown[]) => {
    originalConsole.info(...args);
    writeToLog("info", ...args);
  };

  console.warn = (...args: unknown[]) => {
    originalConsole.warn(...args);
    writeToLog("warn", ...args);
  };

  console.error = (...args: unknown[]) => {
    originalConsole.error(...args);
    writeToLog("error", ...args);
  };

  console.info(`JSONL logging enabled: ${LOG_FILE}`);
}
