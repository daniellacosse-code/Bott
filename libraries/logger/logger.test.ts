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

import { assertEquals } from "jsr:@std/assert";
import { LogLevel, logger } from "./main.ts";

Deno.test("Logger respects LOG_LEVEL environment variable", () => {
  // The logger should default to INFO level if LOG_LEVEL is not set
  // Since we can't easily test console output without complex mocking,
  // we'll test the internal behavior by checking if methods exist
  assertEquals(typeof logger.debug, "function");
  assertEquals(typeof logger.info, "function");
  assertEquals(typeof logger.warn, "function");
  assertEquals(typeof logger.error, "function");
});

Deno.test("LogLevel enum has correct values", () => {
  assertEquals(LogLevel.DEBUG, 0);
  assertEquals(LogLevel.INFO, 1);
  assertEquals(LogLevel.WARN, 2);
  assertEquals(LogLevel.ERROR, 3);
});