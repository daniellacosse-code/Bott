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
 * Allowlisted FFmpeg arguments that are considered safe
 */
const ALLOWED_FFMPEG_ARGS = new Set([
  // Basic I/O
  "-i", "-y", "-f",
  
  // Video filters and processing
  "-vf", "-c:v", "-frames:v", "-preset", "-crf", "-b:v", "-r", "-s",
  "-filter:v", "-vcodec", "-pix_fmt", "-aspect", "-an", "-vn",
  
  // Audio processing
  "-c:a", "-b:a", "-ar", "-ac", "-acodec", "-filter:a", "-af",
  "-application", "-compression_level",
  
  // Timing and duration
  "-t", "-ss", "-to", "-duration",
  
  // Output format
  "-lossless", "-qscale:v", "-quality",
  
  // Specific codecs and formats
  "-libwebp", "-libopus", "-libx265",
  
  // Scaling and dimensions
  "scale", "fps", "format", "yuv420p", "lanczos",
  
  // Template placeholders
  "{{INPUT_FILE}}", "{{OUTPUT_FILE}}"
]);

/**
 * Dangerous patterns that should never appear in FFmpeg arguments
 */
const DANGEROUS_PATTERNS = [
  // Command injection patterns
  /[;&|`$(){}]/,                    // Shell metacharacters
  /\$\{.*\}/,                       // Variable expansion
  /`.*`/,                           // Command substitution
  /\$\(.*\)/,                       // Command substitution
  
  // File system access patterns
  /\.\.\/|\.\.\\|\/etc\/|\/proc\/|\/sys\//, // Path traversal or system dirs
  /\/dev\/|\\\\\.\\|COM\d|LPT\d/,   // Device files
  
  // Network access patterns
  /https?:\/\/|ftp:\/\/|file:\/\//,  // URLs
  /tcp:|udp:|pipe:/,                 // Network protocols
  
  // Dangerous flags
  /-exec|-safe|-protocol|-f\s+concat/, // Dangerous FFmpeg options
  
  // Script execution
  /\.sh|\.bat|\.cmd|\.exe|\.scr/,    // Executable extensions
];

/**
 * Validates FFmpeg arguments to prevent command injection and other security issues
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

    // Check for dangerous patterns
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(arg)) {
        throw new FFmpegSecurityError(
          `FFmpeg argument contains dangerous pattern: ${pattern} in "${arg}"`,
          args
        );
      }
    }

    // Check if the argument starts with a dash (flag) and validate it
    if (arg.startsWith("-")) {
      if (!ALLOWED_FFMPEG_ARGS.has(arg)) {
        throw new FFmpegSecurityError(
          `FFmpeg flag "${arg}" is not in the allowlist`,
          args
        );
      }
    } else {
      // For non-flag arguments, check special cases
      if (arg.includes("{{") && arg.includes("}}")) {
        // Template placeholders are allowed
        if (!ALLOWED_FFMPEG_ARGS.has(arg)) {
          throw new FFmpegSecurityError(
            `FFmpeg template "${arg}" is not in the allowlist`,
            args
          );
        }
      } else {
        // Regular values need additional validation
        validateFFmpegValue(arg, i, args);
      }
    }

    // Check for excessively long arguments
    if (arg.length > 4096) {
      throw new FFmpegSecurityError(`FFmpeg argument at index ${i} is too long`, args);
    }
  }

  return args;
}

/**
 * Validates individual FFmpeg argument values
 */
function validateFFmpegValue(value: string, index: number, args: string[]): void {
  // Check for null bytes
  if (value.includes("\0")) {
    throw new FFmpegSecurityError(
      `FFmpeg argument at index ${index} contains null bytes`,
      args
    );
  }

  // For numeric values, ensure they're reasonable
  if (/^\d+$/.test(value)) {
    const num = parseInt(value, 10);
    if (num < 0 || num > 1000000) {
      throw new FFmpegSecurityError(
        `FFmpeg numeric argument at index ${index} is out of safe range`,
        args
      );
    }
  }

  // For ratio/scale values like "16:9" or "640:480"
  if (/^\d+:\d+$/.test(value)) {
    const parts = value.split(":").map(Number);
    if (parts.some(n => n < 1 || n > 8192)) {
      throw new FFmpegSecurityError(
        `FFmpeg ratio argument at index ${index} contains invalid dimensions`,
        args
      );
    }
  }

  // Check for codec values
  if (/^lib\w+$/.test(value)) {
    const allowedCodecs = ["libwebp", "libopus", "libx265", "libmp3lame"];
    if (!allowedCodecs.includes(value)) {
      throw new FFmpegSecurityError(
        `FFmpeg codec "${value}" is not allowed`,
        args
      );
    }
  }
}

/**
 * Safely constructs FFmpeg arguments by validating and escaping them
 * @param baseArgs Base arguments template
 * @param inputFile Input file path (will be validated separately)
 * @param outputFile Output file path (will be validated separately)
 * @returns Validated and safe FFmpeg arguments
 */
export function buildSafeFFmpegArgs(
  baseArgs: string[],
  inputFile: string,
  outputFile: string
): string[] {
  // First validate the base arguments
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