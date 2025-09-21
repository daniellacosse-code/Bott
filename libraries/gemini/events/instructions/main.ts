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

import type {
  AnyShape,
  BottAction,
  BottChannel,
  BottGlobalSettings,
  BottUser,
} from "@bott/model";

import { getSystemPrompt } from "./systemPrompt.ts";
import { getResponseSchema } from "./responseSchema.ts";

export const getInstructions = <O extends AnyShape>(
  context: {
    user: BottUser;
    channel: BottChannel;
    actions: Record<string, BottAction<O, AnyShape>>;
    settings: BottGlobalSettings;
  },
) => ({
  systemPrompt: getSystemPrompt(context),
  responseSchema: getResponseSchema(context),
});
