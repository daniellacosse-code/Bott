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
 * Sanitizes a string by removing or escaping dangerous characters
 * @param input The string to sanitize
 * @param options Sanitization options
 * @returns The sanitized string
 */
export function sanitizeString(
  input: string,
  options: {
    allowHtml?: boolean;
    maxLength?: number;
    allowUnicode?: boolean;
  } = {}
): string {
  const {
    allowHtml = false,
    maxLength = 4096,
    allowUnicode = true,
  } = options;

  if (typeof input !== "string") {
    return "";
  }

  let sanitized = input;

  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove null bytes and other dangerous control characters
  sanitized = sanitized.replace(/[\0\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Remove or escape HTML if not allowed
  if (!allowHtml) {
    sanitized = sanitized
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }

  // Remove suspicious Unicode direction override characters
  if (allowUnicode) {
    sanitized = sanitized.replace(/[\u202E\u200F\u200E\u2066-\u2069]/g, "");
  } else {
    // Remove all non-ASCII characters if Unicode is not allowed
    sanitized = sanitized.replace(/[^\x20-\x7E]/g, "");
  }

  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, " ").trim();

  return sanitized;
}

/**
 * Sanitizes a filename to make it safe for filesystem operations
 * @param filename The filename to sanitize
 * @returns A safe filename
 */
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== "string" || !filename.trim()) {
    return "unnamed";
  }

  let sanitized = filename.trim();

  // Remove path separators and dangerous characters
  sanitized = sanitized.replace(/[\\\/:\*\?"<>\|]/g, "_");
  
  // Remove control characters
  sanitized = sanitized.replace(/[\0-\x1F\x7F]/g, "");
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf("."));
    const name = sanitized.substring(0, 255 - ext.length);
    sanitized = name + ext;
  }

  // Ensure it doesn't start or end with dots or spaces
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, "");

  // Prevent reserved names on Windows
  const reservedNames = [
    "CON", "PRN", "AUX", "NUL",
    "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
    "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"
  ];

  const nameWithoutExt = sanitized.indexOf(".") > -1 
    ? sanitized.substring(0, sanitized.lastIndexOf("."))
    : sanitized;

  if (reservedNames.includes(nameWithoutExt.toUpperCase())) {
    sanitized = "file_" + sanitized;
  }

  // Ensure the result is not empty
  if (!sanitized) {
    sanitized = "unnamed";
  }

  return sanitized;
}