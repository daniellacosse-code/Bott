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

// import { getSystemPrompt } from "./systemPrompt.ts";
// import { getResponseSchema } from "./responseSchema.ts";

export async function generateOutgoingEvents() {
  // const response = await gemini.models.generateContent({
  //   model,
  //   contents: curatedEvents,
  //   config: {
  //     abortSignal,
  //     candidateCount: 1,
  //     systemInstruction: {
  //       parts: [
  //         { text: context.settings.identity },
  //         {
  //           text: getSystemPrompt(context),
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
}
