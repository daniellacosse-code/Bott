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
  type BottAction,
  type BottActionErrorEvent,
  BottActionEventType,
  type BottActionOutputEvent,
} from "@bott/actions";
import { BOTT_USER } from "@bott/constants";
import { log } from "@bott/log";
import { BottEventType } from "@bott/model";
import {
  addEventListener,
  BottServiceEvent,
  type BottServiceFactory,
  dispatchEvent,
} from "@bott/service";

const RESPONSE_ACTION_NAME = "response";

// Maps each channel ID to the ID of the in-flight response action
const channelActionIndex = new Map<string, string>();

export const startAppService: BottServiceFactory<
  { actions: Record<string, BottAction> }
> = ({ actions }) => {
  if (!actions[RESPONSE_ACTION_NAME]) {
    log.warn(
      `startAppService: ${RESPONSE_ACTION_NAME} action not found. Bott is unable to respond.`,
    );
  }

  addEventListener(BottEventType.MESSAGE, respondIfNotSelf);
  addEventListener(BottEventType.REPLY, respondIfNotSelf);
  addEventListener(BottEventType.REACTION, respondIfNotSelf);

  addEventListener(
    BottActionEventType.ACTION_OUTPUT,
    (output: BottActionOutputEvent) => {
      const { event, shouldInterpretOutput, shouldForwardOutput } =
        output.detail;

      if (shouldInterpretOutput) {
        callResponseAction(event);
      }

      if (shouldForwardOutput) {
        dispatchEvent(event);
      }
    },
  );

  addEventListener(
    BottActionEventType.ACTION_COMPLETE,
    cleanupChannelActionIndex,
  );

  addEventListener(
    BottActionEventType.ACTION_ERROR,
    (event: BottActionErrorEvent) => {
      respondIfNotSelf(event);
      cleanupChannelActionIndex(event);
    },
  );

  return Promise.resolve({
    user: BOTT_USER,
    events: [BottActionEventType.ACTION_CALL],
  });
};

function callResponseAction(event: BottServiceEvent) {
  if (!event.channel) return;

  const actionId = channelActionIndex.get(event.channel.id);

  if (actionId) {
    dispatchEvent(
      new BottServiceEvent(
        BottActionEventType.ACTION_ABORT,
        {
          detail: {
            id: actionId,
            name: RESPONSE_ACTION_NAME,
          },
          user: BOTT_USER,
          channel: event.channel,
        },
      ),
    );
  }

  const id = crypto.randomUUID();

  channelActionIndex.set(event.channel.id, id);

  dispatchEvent(
    new BottServiceEvent(
      BottActionEventType.ACTION_CALL,
      {
        detail: {
          id,
          name: RESPONSE_ACTION_NAME,
        },
        user: BOTT_USER,
        channel: event.channel,
      },
    ),
  );
};

function respondIfNotSelf(event: BottServiceEvent) {
  if (!event.user || event.user.id === BOTT_USER.id) return;

  // Don't respond to errors/aborts from responses to prevent loops
  if (
    event.type === BottActionEventType.ACTION_ERROR &&
    event.detail.name === RESPONSE_ACTION_NAME
  ) return;

  callResponseAction(event);
};

function cleanupChannelActionIndex(event: BottServiceEvent) {
  if (!event.channel) return;

  const actionId = channelActionIndex.get(event.channel.id);

  if (actionId === event.detail.id) {
    channelActionIndex.delete(event.channel.id);
  }
};
