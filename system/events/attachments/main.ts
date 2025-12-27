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

import { BottEventAttachmentType } from "../../types.ts";

export const BOTT_ATTACHMENT_TYPE_LOOKUP: Record<
  BottEventAttachmentType,
  string
> = {
  [BottEventAttachmentType.PDF]: "pdf",
  [BottEventAttachmentType.GIF]: "gif",
  [BottEventAttachmentType.HTML]: "html",
  [BottEventAttachmentType.JPEG]: "jpeg",
  [BottEventAttachmentType.MD]: "md",
  [BottEventAttachmentType.MP3]: "mp3",
  [BottEventAttachmentType.MP4]: "mp4",
  [BottEventAttachmentType.OPUS]: "opus",
  [BottEventAttachmentType.PNG]: "png",
  [BottEventAttachmentType.TXT]: "txt",
  [BottEventAttachmentType.WAV]: "wav",
  [BottEventAttachmentType.WEBP]: "webp",
};
