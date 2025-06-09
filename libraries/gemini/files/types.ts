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

import type { GoogleGenAI } from "npm:@google/genai";

import type { BottOutputFile } from "@bott/model";
import type { storeOutputFile } from "@bott/storage";

export type PromptParameters = {
  abortSignal?: AbortSignal;
  context?: string[];
  model?: string;
  instructions?: string;
  gemini?: GoogleGenAI;
  characterLimit?: number;
  storeOutputFile: typeof storeOutputFile;
};

export type OutputFileGenerator = (
  prompt: string,
  params: PromptParameters,
) => Promise<BottOutputFile>;
