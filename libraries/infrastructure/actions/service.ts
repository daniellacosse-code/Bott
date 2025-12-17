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

import { type BottServiceFactory, type BottAction, type BottActionCallEvent, type BottActionCancelEvent, BottEventType } from "@bott/model";
import { BottEvent } from "@bott/service";

export const startActionService: BottServiceFactory = (options) => {
  const { actions } = options as { actions: Record<string, BottAction> };
  const controllerMap = new Map<string, AbortController>();

  addEventListener(BottEventType.ACTION_CALL, async (event: Event) => {
    if (!(event instanceof BottEvent)) return;
    const callEvent = event as BottActionCallEvent;

    const action = actions[callEvent.detail.name];
    if (!action) {
      globalThis.dispatchEvent(new BottEvent(BottEventType.ACTION_ERROR, {
        detail: {
          id: callEvent.id,
          error: new Error(`Action ${callEvent.detail.name} not found`),
        },
      }));
      return;
    }

    const controller = new AbortController();
    const id = crypto.randomUUID();

    controllerMap.set(id, controller);

    try {
      const output = await action(callEvent.detail.input, {
        signal: controller.signal,
        settings: action,
      });

      globalThis.dispatchEvent(new BottEvent(BottEventType.ACTION_RESULT, {
        detail: {
          id,
          name: action.name,
          output,
        },
      }));
    }
    catch (error) {
      globalThis.dispatchEvent(new BottEvent(BottEventType.ACTION_ERROR, {
        detail: {
          id,
          error: error as Error,
        },
      }));
    }
  });

  addEventListener(BottEventType.ACTION_CANCEL, (event: Event) => {
    if (!(event instanceof BottEvent)) return;
    const cancelEvent = event as BottActionCancelEvent;

    controllerMap.get(cancelEvent.detail.id)?.abort();
    controllerMap.delete(cancelEvent.detail.id);
  });

  return Promise.resolve({
    user: {
      id: "system:actions",
      name: "Actions",
    }
  })
}
