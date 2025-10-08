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

import { Handlebars } from "https://deno.land/x/handlebars/mod.ts";

import { type BottEvent, BottEventType } from "@bott/model";

import { getEventSchema } from "../../utilities/getSchema.ts";
import { queryGemini } from "../../utilities/queryGemini.ts";
import type { EventPipelineProcessor } from "../types.ts";

import rawSystemPrompt from "./systemPrompt_raw.md";
import segmentingSystemPromptTemplate from "./systemPrompt_segment.md.hbs";

export const generateOutput: EventPipelineProcessor = async function (
  context,
) {
  const segmentingSystemPrompt = await new Handlebars().renderView(
    segmentingSystemPromptTemplate,
    { context },
  );

  const rawOutput = await queryGemini<string>(
    context.data.input,
    rawSystemPrompt,
    null,
    context,
  );

  context.data.output = await queryGemini<BottEvent[]>(
    [{
      id: "FAKE",
      type: BottEventType.MESSAGE,
      timestamp: new Date(),
      details: {
        content: rawOutput,
      },
    }],
    segmentingSystemPrompt,
    getEventSchema(context),
    context,
  );

  return context;
};
