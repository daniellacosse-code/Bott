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

import type { BottUser } from "./entities.ts";
import type { AnyShape } from "./utility.ts";

export type BottService = {
  user: BottUser;
};

export type BottServiceFactory = (
  options: AnyShape,
) => Promise<BottService>;
