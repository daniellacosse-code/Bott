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

import { escape } from "jsr:@std/html";

/**
 * Sanitizes a string by removing dangerous characters and optionally escaping HTML
 * Uses Deno standard library for HTML escaping
 * @param input The string to sanitize
 * @param options Sanitization options
 * @returns The sanitized string
 */
export function sanitizeString(
  input: string,
  options: {
    allowHtml?: boolean;
    maxLength?: number;
  } = {}
): string {
  const {
    allowHtml = false,
    maxLength = 4096,
  } = options;

  if (typeof input !== "string") {
    return "";
  }

  let sanitized = input;

  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\0\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Use standard library HTML escaping if HTML not allowed
  if (!allowHtml) {
    sanitized = escape(sanitized);
  }

  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, " ").trim();

  return sanitized;
}

