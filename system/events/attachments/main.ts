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
