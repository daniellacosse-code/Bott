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
  ACTION_RESPONSE_AUDIO_COUNT_LIMIT,
  ACTION_RESPONSE_EVENT_COUNT_LIMIT,
  ACTION_RESPONSE_FILE_TOKEN_LIMIT,
  ACTION_RESPONSE_HISTORY_SIZE_MS,
  ACTION_RESPONSE_VIDEO_COUNT_LIMIT,
  APP_USER,
  GEMINI_EVENT_MODEL,
} from "@bott/constants";
import { BottAttachmentType, type ShallowBottEvent } from "@bott/events";
import type {
  Content,
  GenerateContentResponse,
  Part,
  Schema,
} from "@google/genai";
import { encodeBase64 } from "@std/encoding/base64";
import ejs from "ejs";
import gemini from "../../../client.ts";
import type { EventPipelineContext } from "../pipeline/types.ts";

const eventStructureLocation = new URL(
  "./eventStructure.md.ejs",
  import.meta.url,
);
const eventStructureContents = await Deno.readTextFile(eventStructureLocation);

export interface QueryGeminiOptions {
  model?: string;
  pipeline: EventPipelineContext;
  responseSchema: Schema;
  systemPrompt: string;
  useIdentity?: boolean;
}

export const queryGemini = async <O>(
  input: ShallowBottEvent[],
  {
    systemPrompt,
    responseSchema,
    pipeline,
    model = GEMINI_EVENT_MODEL,
    useIdentity = true,
  }: QueryGeminiOptions,
): Promise<O> => {
  if (!model) {
    throw new Error(
      "No model provided. Ensure `GEMINI_EVENT_MODEL` is set in your environment.",
    );
  }

  const systemInstruction: { parts: Part[] } = {
    parts: [],
  };

  if (useIdentity) {
    systemInstruction.parts.push({
      text: pipeline.action.service.app.identity,
    });
  }

  systemInstruction.parts.push(
    { text: systemPrompt },
    {
      text: ejs.render(eventStructureContents, pipeline.action, {
        filename: eventStructureLocation.pathname,
      }),
    },
  );

  const contents = await prepareContents(input, pipeline, useIdentity);

  const result = await gemini.models.generateContent({
    model,
    contents,
    config: {
      abortSignal: pipeline.action.signal,
      candidateCount: 1,
      systemInstruction,
      responseSchema,
      responseMimeType: "application/json",
      // TODO: Google Search
    },
  });

  return parseResult<O>(result);
};

export const prepareContents = async (
  events: ShallowBottEvent[],
  context: EventPipelineContext,
  hasIdentity: boolean = true,
): Promise<Content[]> => {
  const preparedInput: Content[] = [];
  const timeCutoff = Date.now() - ACTION_RESPONSE_HISTORY_SIZE_MS;
  const resourceAccumulator = {
    tokens: 0,
    audioFiles: 0,
    videoFiles: 0,
  };

  // Iterate backwards to prioritize the most recent events
  for (
    let i = events.length - 1;
    i >= 0 && preparedInput.length < ACTION_RESPONSE_EVENT_COUNT_LIMIT &&
    new Date(events[i].createdAt).getTime() > timeCutoff;
    i--
  ) {
    const event = events[i];

    const eventPart = {
      ...event,
      createdAt: formatTimestampAsRelative(event.createdAt),
      lastProcessedAt: formatTimestampAsRelative(event.lastProcessedAt),
      _pipelineEvaluationMetadata: context?.evaluationState.get(event.id),
    };

    if (event.parent) {
      eventPart.parent = {
        ...event.parent,
        createdAt: formatTimestampAsRelative(event.parent.createdAt),
        lastProcessedAt: formatTimestampAsRelative(
          event.parent.lastProcessedAt,
        ),
      };
    }

    const parts: Part[] = [{ text: JSON.stringify(eventPart) }];
    for (const attachment of eventPart?.attachments ?? []) {
      const newTotalTokens = resourceAccumulator.tokens +
        attachment.compressed.file.size;

      if (newTotalTokens > ACTION_RESPONSE_FILE_TOKEN_LIMIT) continue;

      const isAudio =
        attachment.compressed.file.type === BottAttachmentType.MP3 ||
        attachment.compressed.file.type === BottAttachmentType.OPUS ||
        attachment.compressed.file.type === BottAttachmentType.WAV;

      if (
        isAudio &&
        resourceAccumulator.audioFiles >= ACTION_RESPONSE_AUDIO_COUNT_LIMIT
      ) continue;

      const isVideo =
        attachment.compressed.file.type === BottAttachmentType.MP4;

      if (
        isVideo &&
        resourceAccumulator.videoFiles >= ACTION_RESPONSE_VIDEO_COUNT_LIMIT
      ) continue;

      const fileData = await Deno.readFile(attachment.compressed.path);

      parts.push({
        text: `AttachmentID: ${attachment.id}`,
        inlineData: {
          mimeType: attachment.compressed.file.type,
          data: encodeBase64(fileData),
        },
      });

      resourceAccumulator.tokens = newTotalTokens;
      if (isAudio) resourceAccumulator.audioFiles++;
      if (isVideo) resourceAccumulator.videoFiles++;
    }

    const isModel = eventPart.user.id === APP_USER.id ||
      eventPart.user.id === "service:action";

    preparedInput.unshift({
      role: isModel ? hasIdentity ? "model" : "user" : "user",
      parts,
    });
  }

  return preparedInput;
};

const parseResult = <O>(response: GenerateContentResponse): O => {
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

/**
 * Formats an ISO timestamp as a human-readable relative time string.
 * Examples: "just now", "2 minutes ago", "3 hours ago", "5 days ago"
 * @internal Exported for testing purposes only
 */
export const formatTimestampAsRelative = (
  timestamp: string | undefined,
): string => {
  if (!timestamp) return "never";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "just now";
  } else if (diffMinutes < 60) {
    return diffMinutes === 1 ? "1 minute ago" : `${diffMinutes} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  }

  return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
};
