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
  BOTT_SERVICE,
  TYPING_MAX_TIME_MS,
  TYPING_WORDS_PER_MINUTE,
} from "@bott/constants";

import {
  type BottActionValueEntry,
  BottEventType,
  type BottActionErrorEvent,
  type BottService,
  type BottServiceFactory,
  isBottDataEvent,
  BottActionResultEvent,
} from "@bott/model";
import { addEventListener, BottEvent } from "@bott/service";
import { getEventIdsForChannel, getEvents } from "@bott/storage";

import { delay } from "@std/async";
import {
  BOTT_SERVICE,
  TYPING_MAX_TIME_MS,
  TYPING_WORDS_PER_MINUTE,
} from "@bott/constants";

const MS_IN_MINUTE = 60 * 1000;

export const startMainService: BottServiceFactory = () => {
  const triggerEventGenerationPipeline = async (event: BottEvent, service?: BottService) => {
    if (!event.channel) return;
    if (!event.user) return;
    if (service) return;

    const eventHistoryIds = getEventIdsForChannel(
      event.channel!.id,
    );
    const channelHistory = await getEvents(...eventHistoryIds);

    globalThis.dispatchEvent(
      new BottEvent(BottEventType.ACTION_CALL, {
        detail: {
          name: "message",
          input: channelHistory.map(value => ({ value })),
        },
        user: BOTT_SERVICE.user,
        channel: event.channel,
      }),
    );
  };

  addEventListener(BottEventType.MESSAGE, triggerEventGenerationPipeline);
  addEventListener(BottEventType.REPLY, triggerEventGenerationPipeline);
  addEventListener(BottEventType.REACTION, triggerEventGenerationPipeline);

  addEventListener(BottEventType.ACTION_RESULT, async (event: BottActionResultEvent) => {
    if (event.detail.name !== "message") return;

    for (
      const { value } of event.detail.output as BottActionValueEntry[]
    ) {
      if (!isBottDataEvent(value)) continue;

      // TODO: hoist into response generation action, I think.
      // Typing simulation logic
      const words =
        (value.detail.content as string).split(/\s+/).length;
      const delayMs = (words / TYPING_WORDS_PER_MINUTE) * MS_IN_MINUTE;
      const cappedDelayMs = Math.min(
        delayMs,
        TYPING_MAX_TIME_MS,
      );

      await delay(cappedDelayMs);

      globalThis.dispatchEvent(value);
    }
  });

  // TODO: send message to user (probably via event generation action)
  addEventListener(BottEventType.ACTION_ERROR, (event: BottActionErrorEvent) => {
    console.error(event.detail.error);
  });

  return Promise.resolve(BOTT_SERVICE);
};
