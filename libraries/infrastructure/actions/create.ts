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

import type { BottAction, BottActionFunction, BottActionSettings } from "@bott/model";

export function createAction(fn: BottActionFunction, settings: BottActionSettings): BottAction {
  return Object.assign(fn, settings);
}
