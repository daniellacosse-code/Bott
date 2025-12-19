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

import { throwIfUnsafeFileSize, throwIfUnsafeUrl } from "./validation.ts";

// Test data for benchmarks
const smallFile = new Uint8Array(1024); // 1KB
const mediumFile = new Uint8Array(1024 * 1024); // 1MB
const largeFile = new Uint8Array(10 * 1024 * 1024); // 10MB

const safeHttpUrl = new URL("https://example.com/path");
const safeHttpsUrl = new URL("https://secure.example.com/api/v1");
const urlWithQuery = new URL("https://example.com/path?query=value&foo=bar");
const urlWithFragment = new URL("https://example.com/path#section");

Deno.bench("throwIfUnsafeFileSize - small file (1KB)", () => {
  try {
    throwIfUnsafeFileSize(smallFile);
  } catch {
    // Expected for files over limit
  }
});

Deno.bench("throwIfUnsafeFileSize - medium file (1MB)", () => {
  try {
    throwIfUnsafeFileSize(mediumFile);
  } catch {
    // Expected for files over limit
  }
});

Deno.bench("throwIfUnsafeFileSize - large file (10MB)", () => {
  try {
    throwIfUnsafeFileSize(largeFile);
  } catch {
    // Expected for files over limit
  }
});

Deno.bench("throwIfUnsafeUrl - safe http URL", () => {
  try {
    throwIfUnsafeUrl(safeHttpUrl);
  } catch {
    // Should not throw
  }
});

Deno.bench("throwIfUnsafeUrl - safe https URL", () => {
  try {
    throwIfUnsafeUrl(safeHttpsUrl);
  } catch {
    // Should not throw
  }
});

Deno.bench("throwIfUnsafeUrl - URL with query parameters", () => {
  try {
    throwIfUnsafeUrl(urlWithQuery);
  } catch {
    // Should not throw
  }
});

Deno.bench("throwIfUnsafeUrl - URL with fragment", () => {
  try {
    throwIfUnsafeUrl(urlWithFragment);
  } catch {
    // Should not throw
  }
});

Deno.bench("throwIfUnsafeUrl - localhost (blocked)", () => {
  try {
    throwIfUnsafeUrl(new URL("http://localhost:8080"));
  } catch {
    // Expected to throw
  }
});

Deno.bench("throwIfUnsafeUrl - 127.0.0.1 (blocked)", () => {
  try {
    throwIfUnsafeUrl(new URL("http://127.0.0.1:3000"));
  } catch {
    // Expected to throw
  }
});

Deno.bench("throwIfUnsafeUrl - private IP 10.x (blocked)", () => {
  try {
    throwIfUnsafeUrl(new URL("http://10.0.0.1"));
  } catch {
    // Expected to throw
  }
});

Deno.bench("throwIfUnsafeUrl - private IP 192.168.x (blocked)", () => {
  try {
    throwIfUnsafeUrl(new URL("http://192.168.1.1"));
  } catch {
    // Expected to throw
  }
});

Deno.bench("throwIfUnsafeUrl - metadata endpoint (blocked)", () => {
  try {
    throwIfUnsafeUrl(new URL("http://169.254.169.254/metadata"));
  } catch {
    // Expected to throw
  }
});
