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

import type { EventPipelineProcessor } from "../types.ts";

export const generateRawOutput: EventPipelineProcessor = async function (
  context,
) {
  return context;
  // const response = await gemini.models.generateContent({
  //   model: CONFIG_EVENTS_MODEL,
  //   contents: context.data.input,
  //   config: {
  //     abortSignal: context.abortSignal,
  //     candidateCount: 1,
  //     systemInstruction: {
  //       parts: [
  //         { text: context.settings.identity },
  //         {
  //           text: systemPrompt,
  //         },
  //       ],
  //     },
  //     responseMimeType: "application/json",
  //     responseSchema: getResponseSchema(context),
  //   },
  // });

  // return JSON.parse(
  //   response.candidates?.[0]?.content?.parts
  //     ?.filter((part: Part) => "text" in part && typeof part.text === "string")
  //     .map((part: Part) => (part as { text: string }).text)
  //     .join("") ?? "",
  // );
};
