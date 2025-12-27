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

import type { GenerateContentResponse } from "@google/genai";

export const parseResult = <O>(response: GenerateContentResponse): O => {
  const [candidate] = response.candidates ?? [];
  const { parts } = candidate.content ?? {};

  let text = "";
  for (const part of parts ?? []) {
    if ("text" in part && typeof part.text === "string") {
      text += part.text;
    }
  }

  // Despite the schema, Gemini may still return a code block.
  return JSON.parse(text.replaceAll(/^```(?:json)?\s*|```\s*$/gi, "")) as O;
};
