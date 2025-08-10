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

  // Normalize the paths to resolve any ".." or "." components
  const normalizedPath = normalize(filePath);
  const normalizedBasePath = normalize(allowedBasePath);

  // Resolve the full paths to absolute paths
  const resolvedPath = resolve(normalizedBasePath, normalizedPath);
  const resolvedBasePath = resolve(normalizedBasePath);

  // Check for path traversal attacks
  if (!resolvedPath.startsWith(resolvedBasePath + "/") && resolvedPath !== resolvedBasePath) {
    throw new FilePathSecurityError(
      "Path traversal detected: file path escapes allowed directory",
      filePath
    );
  }

  // Check for dangerous characters and patterns
  const dangerousPatterns = [
    /\0/,           // Null bytes
    /\.\./,         // Directory traversal (additional check)
    /[<>:"|?*]/,    // Windows reserved characters
    /^\./,          // Hidden files (starting with .)
    /~$/,           // Backup files
    /\.tmp$/i,      // Temporary files in some contexts might be risky
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(normalizedPath)) {
      throw new FilePathSecurityError(
        `File path contains dangerous characters or patterns: ${pattern}`,
        filePath
      );
    }
  }

  // Check for excessively long paths
  if (normalizedPath.length > 255) {
    throw new FilePathSecurityError("File path is too long", filePath);
  }

  // Check for reserved names (Windows)
  const fileName = normalizedPath.split("/").pop() || "";
  const reservedNames = [
    "CON", "PRN", "AUX", "NUL",
    "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
    "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"
  ];

  if (reservedNames.includes(fileName.toUpperCase())) {
    throw new FilePathSecurityError("File name is a reserved system name", filePath);
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