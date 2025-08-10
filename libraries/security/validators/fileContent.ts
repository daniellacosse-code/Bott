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
 * Security error for file content validation
 */
export class FileContentSecurityError extends Error {
  constructor(message: string, public readonly contentType?: string) {
    super(message);
    this.name = "FileContentSecurityError";
  }
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
 * Dangerous file content patterns to detect
 */
const DANGEROUS_CONTENT_PATTERNS = [
  // Script injection patterns
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /<iframe[\s\S]*?>/gi,
  /<object[\s\S]*?>/gi,
  /<embed[\s\S]*?>/gi,
  /<form[\s\S]*?>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:[\s\S]*?base64/gi,
  
  // Command injection patterns
  /\$\(.*?\)/g,
  /`.*?`/g,
  /;\s*\w+\s*[|&;]/g,
  
  // PHP injection patterns
  /<\?php/gi,
  /<\?=/gi,
  
  // Server-side includes
  /<!--#[\s\S]*?-->/gi,
];

/**
 * File magic numbers (signatures) for content type validation
 */
const FILE_SIGNATURES = {
  // Images
  "image/jpeg": [
    [0xFF, 0xD8, 0xFF],
  ],
  "image/png": [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  ],
  "image/gif": [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  "image/webp": [
    [0x52, 0x49, 0x46, 0x46], // RIFF (check for WEBP at offset 8)
  ],
  
  // Video
  "video/mp4": [
    [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // ftyp
    [0x00, 0x00, 0x00, 0x1C, 0x66, 0x74, 0x79, 0x70], // ftyp
    [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70], // ftyp
  ],
  
  // Audio
  "audio/mpeg": [
    [0xFF, 0xFB], // MP3
    [0xFF, 0xF3], // MP3
    [0xFF, 0xF2], // MP3
    [0x49, 0x44, 0x33], // ID3 tag
  ],
  "audio/wav": [
    [0x52, 0x49, 0x46, 0x46], // RIFF (check for WAVE at offset 8)
  ],
} as const;

/**
 * Validates file content for security issues
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

  // Validate MIME type
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

  // Verify file signature matches declared type
  const actualMimeType = detectMimeTypeFromContent(content);
  if (actualMimeType && actualMimeType !== declaredMimeType) {
    throw new FileContentSecurityError(
      `File signature indicates ${actualMimeType} but declared as ${declaredMimeType}`,
      declaredMimeType
    );
  }

  // Check for dangerous content patterns (for text/HTML files)
  if (declaredMimeType.startsWith("text/")) {
    const textContent = new TextDecoder().decode(content);
    checkForDangerousTextContent(textContent, declaredMimeType);
  }

  // Additional binary content checks
  if (!declaredMimeType.startsWith("text/")) {
    checkForDangerousBinaryContent(content, declaredMimeType);
  }
}

/**
 * Detects MIME type from file content using magic numbers
 */
function detectMimeTypeFromContent(content: Uint8Array): string | null {
  for (const [mimeType, signatures] of Object.entries(FILE_SIGNATURES)) {
    for (const signature of signatures) {
      if (matchesSignature(content, signature)) {
        // Special case for RIFF files (WebP and WAV)
        if (mimeType === "image/webp") {
          // Check for WEBP signature at offset 8
          const webpSig = [0x57, 0x45, 0x42, 0x50]; // "WEBP"
          if (content.length >= 12 && matchesSignature(content.slice(8, 12), webpSig)) {
            return mimeType;
          }
        } else if (mimeType === "audio/wav") {
          // Check for WAVE signature at offset 8
          const waveSig = [0x57, 0x41, 0x56, 0x45]; // "WAVE"
          if (content.length >= 12 && matchesSignature(content.slice(8, 12), waveSig)) {
            return mimeType;
          }
        } else {
          return mimeType;
        }
      }
    }
  }
  return null;
}

/**
 * Checks if content matches a file signature
 */
function matchesSignature(content: Uint8Array, signature: number[]): boolean {
  if (content.length < signature.length) {
    return false;
  }
  
  for (let i = 0; i < signature.length; i++) {
    if (content[i] !== signature[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Checks text content for dangerous patterns
 */
function checkForDangerousTextContent(content: string, mimeType: string): void {
  for (const pattern of DANGEROUS_CONTENT_PATTERNS) {
    if (pattern.test(content)) {
      throw new FileContentSecurityError(
        `Dangerous content pattern detected: ${pattern}`,
        mimeType
      );
    }
  }

  // Check for excessive null bytes or control characters
  const nullByteCount = (content.match(/\0/g) || []).length;
  if (nullByteCount > 0) {
    throw new FileContentSecurityError(
      "Text content contains null bytes",
      mimeType
    );
  }

  // Check for suspicious Unicode characters
  const suspiciousUnicodePattern = /[\u202E\u200F\u200E\u2066-\u2069]/;
  if (suspiciousUnicodePattern.test(content)) {
    throw new FileContentSecurityError(
      "Text content contains suspicious Unicode direction override characters",
      mimeType
    );
  }
}

/**
 * Checks binary content for potential threats
 */
function checkForDangerousBinaryContent(content: Uint8Array, mimeType: string): void {
  // Check for embedded executables (PE header)
  const peSignature = [0x4D, 0x5A]; // "MZ"
  for (let i = 0; i < Math.min(content.length - 1, 1024); i++) {
    if (matchesSignature(content.slice(i), peSignature)) {
      throw new FileContentSecurityError(
        "Binary content contains embedded executable",
        mimeType
      );
    }
  }

  // Check for ELF executables
  const elfSignature = [0x7F, 0x45, 0x4C, 0x46]; // "\x7FELF"
  if (matchesSignature(content, elfSignature)) {
    throw new FileContentSecurityError(
      "Binary content is an ELF executable",
      mimeType
    );
  }

  // Check for excessive repetition (potential ZIP bombs or similar)
  if (content.length > 1024) {
    const sample = content.slice(0, 1024);
    const uniqueBytes = new Set(sample);
    if (uniqueBytes.size < 10) {
      throw new FileContentSecurityError(
        "Binary content has suspiciously low entropy",
        mimeType
      );
    }
  }
}