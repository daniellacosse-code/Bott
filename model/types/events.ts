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

import type { BottChannel, BottUser } from "./entities.ts";
import type { AnyShape } from "./utility.ts";

/**
 * Enumerates the different types of files that can be associated with a BottEvent.
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

type BottEventAttachmentBase = {
  id: string;
  parent: BottEvent;
};

// Source only - not yet fetched
type BottEventAttachmentSource = BottEventAttachmentBase & {
  source: URL;
  raw?: never;
  compressed?: never;
};

// Raw only - generated content without a source
type BottEventAttachmentRawOnly = BottEventAttachmentBase & {
  source?: never;
  raw: File;
  compressed?: never;
};

// Source + Raw - fetched from URL
type BottEventAttachmentSourceRaw = BottEventAttachmentBase & {
  source: URL;
  raw: File;
  compressed?: never;
};

// Raw + Compressed - generated content that's been compressed
type BottEventAttachmentRawCompressed = BottEventAttachmentBase & {
  source?: never;
  raw: File;
  compressed: File;
};

// Source + Raw + Compressed - fetched and compressed
type BottEventAttachmentComplete = BottEventAttachmentBase & {
  source: URL;
  raw: File;
  compressed: File;
};

export type BottEventAttachment =
  | BottEventAttachmentSource
  | BottEventAttachmentRawOnly
  | BottEventAttachmentSourceRaw
  | BottEventAttachmentRawCompressed
  | BottEventAttachmentComplete;

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
  /** An event representing a call for Bott to perform an action. */
  ACTION_CALL = "actionCall",
  /** An event representing the result of an action. */
  ACTION_RESULT = "actionResult",
}

/**
 * Represents a generic event in Bott.
 */
export interface BottEvent {
  id: string;
  type: BottEventType;
  details: AnyShape;
  /** Timestamp of when the event was created. */
  createdAt: Date;
  /** Timestamp of when the event was last scored/evaluated by the pipeline. */
  lastProcessedAt?: Date;
  /** Optional channel where the event took place. */
  channel?: BottChannel;
  /** Optional parent event, e.g., the message being replied or reacted to. */
  parent?: BottEvent;
  /** Optional user who triggered or is associated with the event. */
  user?: BottUser;
  /** Optional array of attachments associated with the event. */
  attachments?: BottEventAttachment[];
}

export type BottActionCallEvent<O extends AnyShape = AnyShape> = BottEvent & {
  type: BottEventType.ACTION_CALL;
  details: {
    name: string;
    options: O;
  };
};

export type BottActionResultEvent<D extends AnyShape = AnyShape> = BottEvent & {
  type: BottEventType.ACTION_RESULT;
  details: D;
};
