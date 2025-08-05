// /**
//  * @license
//  * This file is part of Bott.
//  *
//  * This project is dual-licensed:
//  * - Non-commercial use: AGPLv3 (see LICENSE file for full text).
//  * - Commercial use: Proprietary License (contact D@nielLaCos.se for details).
//  *
//  * Copyright (C) 2025 DanielLaCos.se
//  */

import { type BottFile, BottFileType } from "@bott/model";

import { prepareHtmlAsMarkdown } from "./input/prepare/html.ts";
import {
  prepareAudioAsOpus,
  prepareDynamicImageAsMp4,
  prepareStaticImageAsWebp,
} from "./prepare/ffmpeg.ts";

// TODO: what was this value?
const MAX_TXT_WORDS = 0;

export const _getResponseContentType = (response: Response): string => {
  const contentTypeHeader = response.headers.get("content-type");
  if (!contentTypeHeader) return "";
  return contentTypeHeader.split(";")[0].trim();
};

export const resolveFile = async (
  partialFile: Partial<BottFile>,
): Promise<BottFile> => {
  if (!partialFile.id) {
    throw new Error("resolveFile: File ID is required.");
  }

  if (!partialFile.source) {
    throw new Error("rresolveFile: File source URL is required.");
  }

  if (!partialFile.raw) {
    const response = await fetch(partialFile.source);
    const data = new Uint8Array(await response.arrayBuffer());
    const type = _getResponseContentType(response) as BottFileType;

    partialFile.raw = { data, type };
  }

  if (!partialFile.raw.path) {
    // TODO: Write file to disk
  }

  if (!partialFile.raw.data) {
    // TODO: Read file from disk
  }

  if (!partialFile.compressed) {
    const rawData = partialFile.raw.data as Uint8Array;
    const rawType = partialFile.raw.type;

    let data, type;
    switch (rawType) {
      case BottFileType.TXT:
        {
          const textDecoder = new TextDecoder();
          let textContent = textDecoder.decode(rawData);
          const words = textContent.split(/\s+/);

          if (words.length > MAX_TXT_WORDS) {
            textContent = words.slice(0, MAX_TXT_WORDS).join(" ") +
              "\n\n...(truncated)";
            data = new TextEncoder().encode(textContent);
          } else {
            data = rawData;
          }
        }
        type = BottFileType.MD;
        break;
      case BottFileType.HTML:
        data = await prepareHtmlAsMarkdown(
          rawData,
        );
        type = BottFileType.MD;
        break;
      case BottFileType.PNG:
      case BottFileType.JPEG:
        data = await prepareStaticImageAsWebp(
          rawData,
        );
        type = BottFileType.WEBP;
        break;
      case BottFileType.MP3:
      case BottFileType.WAV:
        data = await prepareAudioAsOpus(
          rawData,
        );
        type = BottFileType.OPUS;
        break;
      case BottFileType.GIF:
      case BottFileType.MP4:
        data = await prepareDynamicImageAsMp4(
          rawData,
        );
        type = BottFileType.MP4;
        break;
      default:
        throw new Error(`Unsupported source type: ${rawType}`);
    }

    partialFile.compressed = { data, type };
  }

  if (!partialFile.compressed.path) {
    // TODO: Write file to disk
  }

  if (!partialFile.compressed.data) {
    // TODO: Read file from disk
  }

  return partialFile as BottFile;
};
