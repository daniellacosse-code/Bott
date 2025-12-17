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

import { BottServiceFactory, BottAction, BottActionCallEvent, BottActionCancelEvent, BottEventType } from "@bott/model";

export const startActionService: BottServiceFactory = ({ actions }: { actions: Record<string, BottAction> }) => {
  const signalMap = new Map<string, AbortSignal>();

  addEventListener(BottEventType.ACTION_CALL, async (event: BottActionCallEvent) => {
    const action = actions[event.detail.name];
    if (!action) {
      throw new Error(`Action ${event.detail.name} not found`);
    }

    const signal = new AbortController().signal;
    const id = crypto.randomUUID();

    signalMap.set(id, signal);

    try {
      const output = await action(event.detail.input, {
        id,
        signal,
        settings: action.settings,
      });

      globalThis.dispatchEvent(new BottEvent(BottEventType.ACTION_RESULT, {
        detail: {
          id,
          output,
        },
      }));
    }
    catch (error) {
      globalThis.dispatchEvent(new BottEvent(BottEventType.ACTION_ERROR, {
        detail: {
          id,
          error,
        },
      }));
    }
  });

  addEventListener(BottEventType.ACTION_CANCEL, async (event: BottActionCancelEvent) => {
    signalMap.get(event.detail.id)?.abort();
    signalMap.delete(event.detail.id);
  });

  return {
    user: {
      id: "system:actions",
      name: "Actions",
    }
  }
}
