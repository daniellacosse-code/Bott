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
import { escape } from "jsr:@std/html";

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
 * Security error for file content validation
 */
export class FileContentSecurityError extends Error {
  constructor(message: string, public readonly contentType?: string) {
    super(message);
    this.name = "FileContentSecurityError";
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

/**
 * Maximum file sizes for different content types (in bytes)
 */
export const MAX_FILE_SIZES = {
  "text/plain": 10 * 1024 * 1024,       // 10MB for text
  "text/html": 5 * 1024 * 1024,         // 5MB for HTML
  "image/jpeg": 50 * 1024 * 1024,       // 50MB for JPEG
  "image/png": 50 * 1024 * 1024,        // 50MB for PNG
  "image/gif": 100 * 1024 * 1024,       // 100MB for GIF
  "image/webp": 50 * 1024 * 1024,       // 50MB for WebP
  "video/mp4": 500 * 1024 * 1024,       // 500MB for MP4
  "audio/mpeg": 100 * 1024 * 1024,      // 100MB for MP3
  "audio/wav": 100 * 1024 * 1024,       // 100MB for WAV
  "audio/opus": 50 * 1024 * 1024,       // 50MB for Opus
} as const;

/**
 * Allowed MIME types for file uploads
 */
export const ALLOWED_MIME_TYPES = new Set(Object.keys(MAX_FILE_SIZES));

/**
 * Critical dangerous content patterns to detect
 */
const CRITICAL_DANGEROUS_PATTERNS = [
  // Script injection patterns
  /<script\b[^>]*>[\s\S]*?<\/script[^>]*>/gi, // Improved: matches script end tags with optional whitespace/attributes
  /javascript:/gi,
  /vbscript:/gi,
  
  // Command injection patterns
  /\$\(.*?\)/g,
  /`.*?`/g,
  /;\s*\w+\s*[|&;]/g,
  
  // Server-side code
  /<\?php/gi,
];

/**
 * Validates file content for security issues
 * Simplified validation focusing on critical security checks
 * @param content The file content as Uint8Array
 * @param declaredMimeType The declared MIME type
 * @param maxSize Optional maximum size override
 * @throws FileContentSecurityError if content is unsafe
 */
export function validateFileContent(
  content: Uint8Array,
  declaredMimeType: string,
  maxSize?: number
): void {
  if (!content || !(content instanceof Uint8Array)) {
    throw new FileContentSecurityError("Content must be a Uint8Array");
  }

  // Validate MIME type is allowed
  if (!ALLOWED_MIME_TYPES.has(declaredMimeType)) {
    throw new FileContentSecurityError(
      `MIME type "${declaredMimeType}" is not allowed`,
      declaredMimeType
    );
  }

  // Check file size
  const maxFileSize = maxSize ?? MAX_FILE_SIZES[declaredMimeType as keyof typeof MAX_FILE_SIZES];
  if (content.length > maxFileSize) {
    throw new FileContentSecurityError(
      `File size ${content.length} exceeds maximum ${maxFileSize} for ${declaredMimeType}`,
      declaredMimeType
    );
  }

  // Basic content validation for text files
  if (declaredMimeType.startsWith("text/")) {
    const textContent = new TextDecoder().decode(content);
    
    // Check for critical dangerous patterns
    for (const pattern of CRITICAL_DANGEROUS_PATTERNS) {
      if (pattern.test(textContent)) {
        throw new FileContentSecurityError(
          `Dangerous content pattern detected`,
          declaredMimeType
        );
      }
    }

    // Check for null bytes in text content
    if (textContent.includes("\0")) {
      throw new FileContentSecurityError(
        "Text content contains null bytes",
        declaredMimeType
      );
    }
  }
}

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