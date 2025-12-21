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

import type { AnyShape, BottChannel, BottUser } from "@bott/model";
import type { BottEventAttachment, BottEventSettings, BottEventType } from "./types.ts";

/**
 * Represents a generic event in Bott.
 */
export class BottEvent<
  T extends string = string,
  D extends AnyShape = AnyShape,
> extends CustomEvent<D> implements BottEventSettings<T, D> {
  /** The unique identifier of the event. */
  public readonly id: string;

  /** The type of the event. */
  public get type(): T {
    return super.type as T;
  }
  /** Timestamp of when the event was created. */
  public readonly createdAt: Date;
  /** Timestamp of when the event was last scored/evaluated by the pipeline. */
  public lastProcessedAt?: Date;
  /** Optional channel where the event took place. */
  public readonly channel?: BottChannel;
  /** Optional parent event, e.g., the message being replied or reacted to. */
  public readonly parent?: BottEvent;
  /** Optional user who triggered or is associated with the event. */
  public readonly user?: BottUser;
  /** Optional array of attachments associated with the event. */
  public attachments?: BottEventAttachment[];

  constructor(
    type: T,
    eventInit: { detail: D } & Partial<Omit<BottEventSettings<T, D>, "type">>,
  ) {
    super(type, { detail: eventInit.detail });
    this.id = eventInit.id ?? crypto.randomUUID();
    this.createdAt = eventInit.createdAt ?? new Date();
    this.lastProcessedAt = eventInit.lastProcessedAt;
    this.channel = eventInit.channel;
    this.parent = eventInit.parent as BottEvent | undefined;
    this.user = eventInit.user;
    this.attachments = eventInit.attachments;
  }

  /** Requires JSON.stringify support. */
  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      detail: this.detail,
      id: this.id,
      createdAt: this.createdAt,
      lastProcessedAt: this.lastProcessedAt,
      channel: this.channel,
      parent: this.parent,
      user: this.user,
      attachments: this.attachments,
    };
  }
}

export type BottMessageEvent = BottEvent<BottEventType.MESSAGE, {
  content: string;
}>;

export type BottReplyEvent = BottEvent<BottEventType.REPLY, {
  content: string;
}>;

export type BottReactionEvent = BottEvent<BottEventType.REACTION, {
  content: string;
}>;
