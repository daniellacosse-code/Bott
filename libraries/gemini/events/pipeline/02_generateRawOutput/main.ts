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

import type { Part } from "npm:@google/genai";

import { getSystemPrompt } from "./systemPrompt.hbs";
import { getResponseSchema } from "./responseSchema.ts";
import { CONFIG_EVENTS_MODEL } from "../../../constants.ts";

import gemini from "../../../client.ts";

export async function generateRawOutput(inputEvents, context) {
  const response = await gemini.models.generateContent({
    model: CONFIG_EVENTS_MODEL,
    contents: inputEvents,
    config: {
      abortSignal: context.abortSignal,
      candidateCount: 1,
      systemInstruction: {
        parts: [
          { text: context.settings.identity },
          {
            text: getSystemPrompt(context),
          },
        ],
      },
      responseMimeType: "application/json",
      responseSchema: getResponseSchema(context),
    },
  });

  return JSON.parse(
    response.candidates?.[0]?.content?.parts
      ?.filter((part: Part) => "text" in part && typeof part.text === "string")
      .map((part: Part) => (part as { text: string }).text)
      .join("") ?? "",
  );
}
