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

import { BottEventType, type BottEvent as BottEventInterface } from "@bott/model";
import type { BottActionCallEvent, BottActionCompleteEvent } from "./types.ts";

export function isBottActionCallEvent(
  event: BottEventInterface,
): event is BottActionCallEvent {
  return event.type === BottEventType.ACTION_CALL;
}

export function isBottActionCompleteEvent(
  event: BottEventInterface,
): event is BottActionCompleteEvent {
  return event.type === BottEventType.ACTION_COMPLETE;
}
