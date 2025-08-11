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
import { validateFilePath, FilePathSecurityError, safeJoinPath } from "./filePath.ts";

Deno.test("validateFilePath - basic validation", () => {
  const basePath = "/safe/directory";
  
  // Valid paths should pass
  assertEquals(validateFilePath("normal.txt", basePath), "normal.txt");
  assertEquals(validateFilePath("sub/folder/file.txt", basePath), "sub/folder/file.txt");
});

Deno.test("validateFilePath - path traversal attacks", () => {
  const basePath = "/safe/directory";
  
  // Path traversal attempts should fail
  assertThrows(
    () => validateFilePath("../../../etc/passwd", basePath),
    FilePathSecurityError,
    "Path traversal detected"
  );
  
  assertThrows(
    () => validateFilePath("..\\..\\windows\\system32\\config", basePath),
    FilePathSecurityError,
    "Path traversal detected"
  );
  
  assertThrows(
    () => validateFilePath("./../../secret.txt", basePath),
    FilePathSecurityError,
    "Path traversal detected"
  );
});

Deno.test("validateFilePath - dangerous characters", () => {
  const basePath = "/safe/directory";
  
  // Null bytes should fail
  assertThrows(
    () => validateFilePath("file\0.txt", basePath),
    FilePathSecurityError,
    "null bytes"
  );
});

Deno.test("validateFilePath - excessive length", () => {
  const basePath = "/safe/directory";
  const longPath = "a".repeat(300);
  
  assertThrows(
    () => validateFilePath(longPath, basePath),
    FilePathSecurityError,
    "too long"
  );
});
  
  assertThrows(
    () => validateFilePath(longPath, basePath),
    FilePathSecurityError,
    "too long"
  );
});

Deno.test("safeJoinPath - safe construction", () => {
  const basePath = "/safe/directory";
  
  const result = safeJoinPath(basePath, "subfolder/file.txt");
  assertEquals(result, "/safe/directory/subfolder/file.txt");
});

Deno.test("safeJoinPath - prevents traversal", () => {
  const basePath = "/safe/directory";
  
  assertThrows(
    () => safeJoinPath(basePath, "../../../etc/passwd"),
    FilePathSecurityError,
    "Path traversal detected"
  );
});