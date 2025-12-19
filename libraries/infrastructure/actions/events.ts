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

import type { BottEvent as BottEventInterface } from "@bott/model";
import { BottActionEventType } from "./types.ts";
import type { BottActionCallEvent, BottActionCompleteEvent } from "./types.ts";

export function isBottActionCallEvent(
  event: BottEventInterface,
): event is BottActionCallEvent {
  return event.type === BottActionEventType.ACTION_CALL;
}

export function isBottActionCompleteEvent(
  event: BottEventInterface,
): event is BottActionCompleteEvent {
  return event.type === BottActionEventType.ACTION_COMPLETE;
}
