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

import { BottEventType, type ShallowBottEvent } from "@bott/events";
import { log } from "@bott/log";
import { getEventSchema } from "../../common/getSchema.ts";
import { queryGemini } from "../../common/queryGemini.ts";
import type { EventPipelineProcessor } from "../types.ts";

const systemPrompt = await Deno.readTextFile(
  new URL("./systemPrompt.md", import.meta.url),
);

export const patchOutput: EventPipelineProcessor = async function () {
  if (!this.data.output.length) {
    return;
  }

  const patchableOutputs = [];
  const remainingOutputs = [];

  for (const event of this.data.output) {
    if (
      event.type === BottEventType.REACTION ||
      event.type === BottEventType.ACTION_CALL
    ) {
      patchableOutputs.push(event);
      continue;
    }

    remainingOutputs.push(event);
  }
  let patchedEvents: ShallowBottEvent[] = [];

  if (!patchableOutputs.length) {
    return;
  }

  log.debug(this.action.id, patchableOutputs);

  patchedEvents = await queryGemini<ShallowBottEvent[]>(
    patchableOutputs,
    {
      systemPrompt,
      responseSchema: getEventSchema(this.action.service.settings),
      pipeline: this,
      useIdentity: false,
    },
  );

  // Trusted Patching:
  // Since this step is explicitly designed to fix issues, we treat its output as "trusted".
  // We automatically inject all active output reasons as "passed" for these events,
  // bypassing the need for a re-evaluation loop.
  for (const event of patchedEvents) {
    this.evaluationState.set(event.id, {
      outputReasons: [{
        name: "patchOutput",
        description: "This event was patched by the patchOutput step.",
        validator: () => true,
      }],
    });
  }

  this.data.output = [...patchedEvents, ...remainingOutputs];

  log.debug(this.data.output);
};
