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

import { join } from "jsr:@std/path";

export const DISCORD_MESSAGE_LIMIT = 2000;

const FOUR_WEEKS_MS = 4 * 7 * 24 * 60 * 60 * 1000;
export const RATE_LIMIT_WINDOW_MS = FOUR_WEEKS_MS;
export const RATE_LIMIT_IMAGES = Number(
  Deno.env.get("CONFIG_RATE_LIMIT_IMAGES") ??
    100,
);
export const RATE_LIMIT_MUSIC = Number(
  Deno.env.get("CONFIG_RATE_LIMIT_MUSIC") ??
    25,
);
export const RATE_LIMIT_VIDEOS = Number(
  Deno.env.get("CONFIG_RATE_LIMIT_VIDEOS") ?? 10,
);

export const STORAGE_ROOT = Deno.env.get("FILE_SYSTEM_ROOT") ?? "./fs_root";
export const STORAGE_DEPLOY_NONCE_PATH = join(
  STORAGE_ROOT,
  ".deploy-nonce",
);

// Security Constants
export const SECURITY_MAX_EVENT_HISTORY = Number(
  Deno.env.get("CONFIG_INPUT_EVENT_LIMIT") ?? 2000,
);

export const SECURITY_MAX_FILE_TOKEN_LIMIT = Number(
  Deno.env.get("CONFIG_INPUT_FILE_TOKEN_LIMIT") ?? 500000,
);

// Security: Request timeout for external resources
export const SECURITY_REQUEST_TIMEOUT_MS = 30000;

// Security: Maximum concurrent operations
export const SECURITY_MAX_CONCURRENT_OPERATIONS = 10;
