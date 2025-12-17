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

import type { BottEvent, BottEventType, BottDataEvent } from "./events.ts";

export type BottAction = BottActionFunction & BottActionSettings;

export type BottActionFunction = (
  input: BottActionValueEntry[],
  context: BottActionContext,
) => Promise<BottActionValueEntry[]>;

export type BottActionContext = {
  signal: AbortSignal;
  settings: BottActionSettings;
};

export type BottActionSettings = {
  name: string;
  instructions: string;
  schema: {
    input: BottActionSchema[];
    output: BottActionSchema[];
  }
};

type BottActionValue = string | number | boolean | File | BottDataEvent;

export type BottActionSchema = {
  name: string;
  type: "string" | "number" | "boolean" | "file" | "event";
  allowedValues?: BottActionValue[];
  description?: string;
  required?: boolean;
};

export type BottActionValueEntry = {
  name: string;
  value: BottActionValue;
}

export type BottActionCallEvent = BottEvent<
  BottEventType.ACTION_CALL,
  {
    name: string;
    input: BottActionValueEntry[];
  }
>;

export type BottActionStartEvent = BottEvent<
  BottEventType.ACTION_START,
  {
    id: string;
    name: string;
  }
>;

export type BottActionCancelEvent = BottEvent<
  BottEventType.ACTION_CANCEL,
  {
    id: string;
  }
>;

export type BottActionResultEvent = BottEvent<
  BottEventType.ACTION_RESULT, {
    id: string;
    name: string;
    output: BottActionValueEntry[];
  }
>;


export type BottActionErrorEvent = BottEvent<
  BottEventType.ACTION_ERROR,
  {
    id: string;
    error: Error;
  }
>;
