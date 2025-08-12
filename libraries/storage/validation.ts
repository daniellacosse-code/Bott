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
 * Storage validation utilities for security
 */

// Maximum file size in bytes (50MB)
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Validates file size
 * @param data File data to validate
 * @returns true if valid, false if too large
 */
export function validateFileSize(data: Uint8Array): boolean {
  return data.length <= MAX_FILE_SIZE;
}

/**
 * Validates URL for SSRF protection
 * @param url URL to validate
 * @returns true if valid, false if not allowed
 */
export function validateUrl(url: string): boolean {
  let parsedUrl: URL;
  
  try {
    parsedUrl = new URL(url);
  } catch {
    return false;
  }
  
  // Only allow HTTP and HTTPS
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return false;
  }
  
  // Block localhost and private IP ranges
  const hostname = parsedUrl.hostname.toLowerCase();
  
  // Block localhost variations
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
    return false;
  }
  
  // Block private IP ranges (IPv4)
  const ipv4Patterns = [
    /^10\./,                    // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16.0.0/12
    /^192\.168\./,              // 192.168.0.0/16
    /^169\.254\./,              // 169.254.0.0/16 (link-local)
  ];
  
  if (ipv4Patterns.some(pattern => pattern.test(hostname))) {
    return false;
  }
  
  // Block common internal hostnames
  const blockedHostnames = [
    "metadata.google.internal",
    "169.254.169.254", // AWS/GCP metadata
    "metadata",
    "consul",
    "vault",
  ];
  
  if (blockedHostnames.some(blocked => hostname.includes(blocked))) {
    return false;
  }
  
  return true;
}