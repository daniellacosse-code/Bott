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

import { join, normalize, resolve } from "jsr:@std/path";

/**
 * Security error for file path validation
 */
export class FilePathSecurityError extends Error {
  constructor(message: string, public readonly path: string) {
    super(message);
    this.name = "FilePathSecurityError";
  }
}

/**
 * Validates that a file path is safe and prevents path traversal attacks
 * Uses Deno standard library path functions for validation
 * @param filePath The file path to validate
 * @param allowedBasePath The base directory that files must stay within
 * @throws FilePathSecurityError if the path is invalid or unsafe
 */
export function validateFilePath(filePath: string, allowedBasePath: string): string {
  if (!filePath || typeof filePath !== "string") {
    throw new FilePathSecurityError("File path must be a non-empty string", filePath);
  }

  if (!allowedBasePath || typeof allowedBasePath !== "string") {
    throw new FilePathSecurityError("Allowed base path must be a non-empty string", filePath);
  }

  // Normalize paths using standard library
  const normalizedPath = normalize(filePath);
  const normalizedBasePath = normalize(allowedBasePath);

  // Resolve to absolute paths using standard library
  const resolvedPath = resolve(normalizedBasePath, normalizedPath);
  const resolvedBasePath = resolve(normalizedBasePath);

  // Check for path traversal - must be within base path
  if (!resolvedPath.startsWith(resolvedBasePath + "/") && resolvedPath !== resolvedBasePath) {
    throw new FilePathSecurityError(
      "Path traversal detected: file path escapes allowed directory",
      filePath
    );
  }

  // Basic security checks
  if (normalizedPath.includes("\0")) {
    throw new FilePathSecurityError("File path contains null bytes", filePath);
  }

  if (normalizedPath.length > 255) {
    throw new FilePathSecurityError("File path is too long", filePath);
  }

  return normalizedPath;
}

/**
 * Safely constructs a file path within an allowed directory
 * @param basePath The base directory
 * @param relativePath The relative path to append
 * @returns The validated safe path
 */
export function safeJoinPath(basePath: string, relativePath: string): string {
  const safePath = validateFilePath(relativePath, basePath);
  return join(basePath, safePath);
}