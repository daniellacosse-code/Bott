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

import {
  type AnyShape,
  type BottAction,
  type BottActionCallEvent,
  type BottChannel,
  type BottEvent,
  BottEventType,
  type BottGlobalSettings,
  type BottUser,
} from "@bott/model";
import { log } from "@bott/logger";
import { addEventData, getEvents } from "@bott/storage";

import {
  curateIncomingEvents,
  curateOutgoingEvents,
  generateOutgoingEvents,
  scoreOutgoingEvents,
  segmentOutgoingEvents,
} from "./pipeline/main.ts";

type GeminiEventGenerationResult = {
  inputEventScores: BottEvent<
    { content: string; scores: Record<string, GeminiEventTraitScore> }
  >[];
  outputEvents: (
    | BottEvent<
      { content: string; scores: Record<string, GeminiEventTraitScore> }
    >
    | BottEvent<
      {
        name: string;
        options: AnyShape;
        scores: Record<string, GeminiEventTraitScore>;
      }
    >
  )[];
  outputScores?: Record<string, GeminiEventTraitScore>;
};

type GeminiEventTraitScore = {
  score: number;
  rationale?: string;
};

export async function* generateEvents<O extends AnyShape>(
  inputEvents: BottEvent<AnyShape>[],
  {
    abortSignal,
    context,
  }: {
    model?: string;
    abortSignal: AbortSignal;
    context: {
      user: BottUser;
      channel: BottChannel;
      actions: Record<string, BottAction<O, AnyShape>>;
      settings: BottGlobalSettings;
    };
  },
): AsyncGenerator<
  | BottEvent<{ content: string; scores?: Record<string, number> }>
  | BottActionCallEvent<O>
> {
  const curatedEvents = await curateIncomingEvents(inputEvents, context);

  if (!curatedEvents.length) {
    return;
  }

  try {
    await addEventData(...curatedEvents);
  } catch () {

  }

  const initialOutput = await generateOutgoingEvents(curatedEvents, context);
  const segementedOutput = await segmentOutgoingEvents(initialOutput, context);
  const scoredOutput = await scoreOutgoingEvents(segementedOutput, context);
  const finalOutput = await curateOutgoingEvents(scoredOutput, context);

  _debugLogFinalOutput(finalOutput);

  for (const event of finalOutput) {
    const commonFields = {
      id: crypto.randomUUID(),
      type: event.type,
      timestamp: new Date(),
      user: context.user,
      channel: context.channel,
      // Gemini does not return the full parent event
      parent: event.parent ? (await getEvents(event.parent.id))[0] : undefined,
    };

    if (event.type === BottEventType.ACTION_CALL) {
      yield {
        ...commonFields,
        type: BottEventType.ACTION_CALL,
        details: event.details as {
          name: string;
          options: O;
          scores: Record<string, number>;
        },
      };
    } else {
      yield {
        ...commonFields,
        details: event.details as {
          content: string;
          scores: Record<string, number>;
        },
      };
    }
  }

  return;
}

const _debugLogFinalOutput = (result: GeminiEventGenerationResult) => {
  let logMessage = "Gemini processing result:\n";

  for (const event of result.inputEventScores) {
    if (!event.details) {
      continue;
    }

    logMessage += `[INPUT] Scored event #${event.id}: "${
      _truncateMessage(event.details.content)
    }"\n`;

    for (const trait in event.details.scores) {
      logMessage += `  => [${trait}: ${event.details.scores[trait].score}] ${
        event.details.scores[trait].rationale ?? ""
      }\n`;
    }
  }

  for (const event of result.outputEvents) {
    if (!event.details) {
      continue;
    }

    if (event.type === BottEventType.ACTION_CALL) {
      const details = event.details as {
        name: string;
        options: AnyShape;
        scores: Record<string, GeminiEventTraitScore>;
      };
      logMessage += `[OUTPUT] Generated request \`${details.name}\`\n`;
      for (const option in details.options) {
        logMessage += `  => ${option}: ${details.options[option]}\n`;
      }
    } else {
      const details = event.details as {
        content: string;
        scores: Record<string, GeminiEventTraitScore>;
      };
      const parentInfo = event.parent
        ? ` (in reply to #${event.parent.id})`
        : "";
      logMessage += `[OUTPUT] Generated ${event.type}${parentInfo}: "${
        _truncateMessage(details.content)
      }"\n`;
    }

    for (const trait in event.details.scores) {
      logMessage += `  => [${trait}: ${event.details.scores[trait].score}] ${
        event.details.scores[trait].rationale ?? ""
      }\n`;
    }
  }

  if (result.outputScores) {
    logMessage += "[OVERALL SCORES]\n";
    for (const trait in result.outputScores) {
      logMessage += `  => [${trait}: ${result.outputScores[trait].score}] ${
        result.outputScores[trait].rationale ?? ""
      }\n`;
    }
  }

  log.debug(logMessage.trim());
};

const _truncateMessage = (message: string, maxWordCount = 12) => {
  const words = message.trim().split(/\s+/);

  const result = words.slice(0, maxWordCount).join(" ");

  if (words.length <= maxWordCount) {
    return result;
  }

  return result + "…";
};
