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
 * Security error for FFmpeg argument validation
 */
export class FFmpegSecurityError extends Error {
  constructor(message: string, public readonly args: string[]) {
    super(message);
    this.name = "FFmpegSecurityError";
  }
}

/**
 * Critical dangerous patterns that should never appear in FFmpeg arguments
 */
const CRITICAL_DANGEROUS_PATTERNS = [
  // Command injection patterns
  /[;&|`$(){}]/,                    // Shell metacharacters
  /\$\{.*\}/,                       // Variable expansion
  /`.*`/,                           // Command substitution
  /\$\(.*\)/,                       // Command substitution
  
  // Network access patterns (prevent data exfiltration)
  /https?:\/\/|ftp:\/\/|tcp:|udp:/,  
  
  // File system access to dangerous areas
  /\/etc\/|\/proc\/|\/sys\/|\/dev\//,
];

/**
 * Validates FFmpeg arguments to prevent command injection
 * Simplified validation focusing on critical security issues
 * @param args Array of FFmpeg arguments to validate
 * @throws FFmpegSecurityError if any argument is considered unsafe
 */
export function validateFFmpegArgs(args: string[]): string[] {
  if (!Array.isArray(args)) {
    throw new FFmpegSecurityError("FFmpeg arguments must be an array", args);
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (typeof arg !== "string") {
      throw new FFmpegSecurityError(`FFmpeg argument at index ${i} must be a string`, args);
    }

    // Check for critical dangerous patterns
    for (const pattern of CRITICAL_DANGEROUS_PATTERNS) {
      if (pattern.test(arg)) {
        throw new FFmpegSecurityError(
          `FFmpeg argument contains dangerous pattern: ${pattern} in "${arg}"`,
          args
        );
      }
    }

    // Check for null bytes
    if (arg.includes("\0")) {
      throw new FFmpegSecurityError(
        `FFmpeg argument at index ${i} contains null bytes`,
        args
      );
    }

    // Check for excessively long arguments
    if (arg.length > 4096) {
      throw new FFmpegSecurityError(`FFmpeg argument at index ${i} is too long`, args);
    }
  }

  return args;
}

/**
 * Safely constructs FFmpeg arguments by validating and replacing templates
 * @param baseArgs Base arguments template
 * @param inputFile Input file path
 * @param outputFile Output file path
 * @returns Validated FFmpeg arguments
 */
export function buildSafeFFmpegArgs(
  baseArgs: string[],
  inputFile: string,
  outputFile: string
): string[] {
  // Validate the base arguments first
  const validatedArgs = validateFFmpegArgs([...baseArgs]);
  
  // Replace template placeholders with actual file paths
  const processedArgs = validatedArgs.map((arg) => {
    switch (arg) {
      case "{{INPUT_FILE}}":
        return inputFile;
      case "{{OUTPUT_FILE}}":
        return outputFile;
      default:
        return arg;
    }
  });

  return processedArgs;
}