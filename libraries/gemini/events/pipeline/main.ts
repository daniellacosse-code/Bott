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

import { focusInput } from "./01_focusInput/main.ts";
import { generateOutput } from "./02_generateOutput/main.ts";
import { classifyOutput } from "./03_classifyOutput/main.ts";
import { finalizeOutput } from "./04_finalizeOutput/main.ts";

import type { EventPipeline } from "./types.ts";

export * from "./types.ts";

export default [
  focusInput,
  generateOutput,
  classifyOutput,
  finalizeOutput,
] as EventPipeline;
