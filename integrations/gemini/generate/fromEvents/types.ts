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

import type { BottEventType } from "@bott/system";

export type GeminiEventSkeleton = {
  type: BottEventType.MESSAGE | BottEventType.REPLY | BottEventType.REACTION;
  detail: {
    content: string;
  };
  parent?: {
    id: string;
  };
} | {
  type: BottEventType.ACTION_CALL;
  detail: {
    name: string;
    parameters?: Record<string, unknown>;
  };
} | {
  type: BottEventType.ACTION_ABORT;
  detail: {
    id: string;
  };
};
