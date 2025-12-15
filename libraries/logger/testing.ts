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

import { formatArgs, allowedTopics, setLogInterceptor } from "./logger.ts";

// Simple log record for testing
export interface TestLogRecord {
  msg: string;
  datetime: Date;
  level: string;
}

// Test handler for capturing logs during testing
export class TestHandler {
  public logs: TestLogRecord[] = [];

  log(level: string, args: unknown[]): void {
    const msg = formatArgs(...args);
    this.logs.push({
      msg,
      datetime: new Date(),
      level,
    });
  }

  clear(): void {
    this.logs = [];
  }
}

export const testHandler: TestHandler = new TestHandler();

export function addLogTopic(topic: string): void {
  allowedTopics.add(topic.toLowerCase().trim());
}

export function setupTestLogger(): void {
  allowedTopics.clear();

  // Enable standard log levels for tests
  addLogTopic("debug");
  addLogTopic("info");
  addLogTopic("warn");
  addLogTopic("error");

  // Set the interceptor to direct logs to testHandler
  setLogInterceptor((level, args) => {
    // Only log if topic is allowed (mimicking real logger behavior)
    // Note: perf is handled inside logging.ts logic before calling interceptor for timing, 
    // but we can check here too or assume logging.ts handles it.
    // In logging.ts, interception check is inside the method, BEFORE allowedTopics check for debug/info/etc.
    // So we should enforce topic check here if we want to simulate filtering.
    // However, logging.ts implementation:
    /*
      debug(...args) {
        if (interceptor) { interceptor... return; }
        if (allowedTopics...) { ... }
      }
    */
    // So if interceptor is set, topic filtering is skipped in logging.ts.
    // We should implement filtering here if we want accurate test simulation.

    if (allowedTopics.has(level === "perf" ? "perf" : level)) {
      testHandler.log(level.toUpperCase(), args);
    }
  });
}
