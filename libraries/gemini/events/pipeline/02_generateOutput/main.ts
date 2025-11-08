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

import type { BottEvent } from "@bott/model";

import { getEventSchema } from "../../utilities/getSchema.ts";
import { queryGemini } from "../../utilities/queryGemini.ts";
import type { EventPipelineProcessor } from "../types.ts";

const rawSystemPrompt = await Deno.readTextFile(
  new URL("./systemPrompt_raw.md", import.meta.url),
);

const segmentingSystemPrompt = await Deno.readTextFile(
  new URL("./systemPrompt_segment.md", import.meta.url),
);

export const generateOutput: EventPipelineProcessor = async function (
  context,
) {
  // If there's nothing to focus on, skip this step.
  if (!context.data.input.some((event) => event.details.focus)) {
    return context;
  }

  const rawOutput = await queryGemini<string>(
    context.data.input,
    rawSystemPrompt,
    null,
    context,
  );

  context.data.output = await queryGemini<BottEvent[]>(
    rawOutput,
    segmentingSystemPrompt,
    getEventSchema(context),
    context,
  );

  return context;
};
