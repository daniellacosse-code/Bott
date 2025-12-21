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

/**
 * Enumerates the different types of events that can occur in Bott.
 */
export enum BottEventType {
  /** A standard message event. */
  MESSAGE = "message",
  /** A reply to a previous message. */
  REPLY = "reply",
  /** A reaction (e.g., emoji) to a previous message. */
  REACTION = "reaction",
}

/**
 * Enumerates the different types of attachments that can be associated with a BottEvent.
 */
export enum BottAttachmentType {
  GIF = "image/gif",
  HTML = "text/html",
  JPEG = "image/jpeg",
  MD = "text/markdown",
  MP3 = "audio/mpeg",
  MP4 = "video/mp4",
  OPUS = "audio/opus",
  PNG = "image/png",
  TXT = "text/plain",
  WAV = "audio/x-wav",
  WEBP = "image/webp",
}

/**
 * Represents a generic event in Bott.
 */
export interface BottEventSettings<
  T extends string = string,
  D extends AnyShape = AnyShape,
> {
  /** The type of the event. */
  type: T;
  /** The unique identifier of the event. */
  id: string;
  /** Timestamp of when the event was created. */
  createdAt: Date;
  /** Timestamp of when the event was last scored/evaluated by the pipeline. */
  lastProcessedAt?: Date;
  /** Optional channel where the event took place. */
  channel?: BottChannel;
  /** Optional parent event, e.g., the message being replied or reacted to. */
  parent?: BottEventSettings;
  /** Optional user who triggered or is associated with the event. */
  user?: BottUser;
  /** Optional array of attachments associated with the event. */
  attachments?: BottEventAttachment[];
}

export interface BottMessageEventSettings extends BottEventSettings<BottEventType.MESSAGE, {
  content: string;
}> { }

export interface BottReplyEventSettings extends BottEventSettings<BottEventType.REPLY, {
  content: string;
}> { }

export interface BottReactionEventSettings extends BottEventSettings<BottEventType.REACTION, {
  content: string;
}> { }

/**
 * Represents an attachment associated with a BottEvent.
 */
export type BottEventAttachment = {
  id: string;
  parent: BottEventSettings;
  originalSource: URL;
  raw: {
    id: string;
    path: string;
    file: File;
  };
  compressed: {
    id: string;
    path: string;
    file: File;
  };
};
