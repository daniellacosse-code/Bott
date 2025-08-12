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

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const getCurrentLevel = (): LogLevel => {
  const envLevel = Deno.env.get("LOG_LEVEL")?.toUpperCase();
  switch (envLevel) {
    case "DEBUG": return LogLevel.DEBUG;
    case "INFO": return LogLevel.INFO;
    case "WARN": return LogLevel.WARN;
    case "ERROR": return LogLevel.ERROR;
    default: return LogLevel.INFO; // Default to INFO level
  }
};

const currentLevel = getCurrentLevel();

const shouldLog = (level: LogLevel): boolean => {
  return level >= currentLevel;
};

// Export a simple logger object
export const log = {
  debug(...args: unknown[]): void {
    if (shouldLog(LogLevel.DEBUG)) {
      console.debug(...args);
    }
  },

  info(...args: unknown[]): void {
    if (shouldLog(LogLevel.INFO)) {
      console.info(...args);
    }
  },

  warn(...args: unknown[]): void {
    if (shouldLog(LogLevel.WARN)) {
      console.warn(...args);
    }
  },

  error(...args: unknown[]): void {
    if (shouldLog(LogLevel.ERROR)) {
      console.error(...args);
    }
  },
};