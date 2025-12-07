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

import { join } from "@std/path";

import {
  BOTT_ATTACHMENT_TYPE_LOOKUP,
  BottAttachmentType,
  type BottEventAttachment,
} from "@bott/model";
import { throwIfUnsafeFileSize, throwIfUnsafeUrl } from "../validation.ts";
import { log } from "@bott/logger";

import { STORAGE_FILE_ROOT } from "../start.ts";
import { prepareHtmlAsMarkdown } from "./prepare/html.ts";
import {
  prepareAudioAsOpus,
  prepareDynamicImageAsMp4,
  prepareStaticImageAsWebp,
} from "./prepare/ffmpeg.ts";

const FETCH_TIMEOUT_MS = 30 * 1000;

const MAX_TXT_WORDS = 600;

/**
 * Fully resolves a `BottEventAttachment` object by ensuring its `raw` and `compressed` data are available.
 * If `raw` data is missing, it attempts to fetch it from the `source` URL.
 * If `compressed` data is missing, it generates it from the `raw` data based on the file type.
 * @param attachment `file` to be resolved.
 * @returns `BottEventAttachment` with its `raw` and `compressed` data populated.
 */
export const resolveAttachment = async (
  attachment: BottEventAttachment,
): Promise<BottEventAttachment> => {
  const fileRoot = join(STORAGE_FILE_ROOT, attachment.id);

  Deno.mkdirSync(fileRoot, { recursive: true });

  let rawFilePath, compressedFilePath;
  for (const diskFile of Deno.readDirSync(fileRoot)) {
    if (diskFile.name.startsWith("raw.")) {
      rawFilePath = join(fileRoot, diskFile.name);
    } else if (diskFile.name.startsWith("compressed.")) {
      compressedFilePath = join(fileRoot, diskFile.name);
    }
  }

  let rawFile: File | undefined = attachment.raw;

  if (rawFilePath && !rawFile) {
    const rawFileExtension = rawFilePath.split(".").pop();

    rawFile = new File(
      [Deno.readFileSync(rawFilePath)],
      `raw.${rawFileExtension}`,
      {
        type: BottAttachmentType[
          rawFileExtension?.toUpperCase() as keyof typeof BottAttachmentType
        ],
      },
    );
  }

  if (!rawFile) {
    if (!attachment.source) {
      throw new Error(
        "File source URL is required when raw data is missing.",
      );
    }

    throwIfUnsafeUrl(attachment.source);

    log.debug(
      `Fetching raw file from source URL: ${attachment.source}`,
    );

    const response = await fetch(attachment.source, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
      headers: {
        "User-Agent": "Bott",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = new Uint8Array(await response.arrayBuffer());

    throwIfUnsafeFileSize(data);

    const type = response.headers.get("content-type")?.split(";")[0].trim() ??
      "";

    if (
      !Object.values(BottAttachmentType).includes(type as BottAttachmentType)
    ) {
      throw new Error(`Unsupported content type: ${type}`);
    }

    rawFile = new File([data], `raw.${type.split("/")[1]}`, { type });
  }

  if (!rawFilePath && rawFile) {
    log.debug(
      `Writing raw file to disk: ${attachment.id}, type: ${rawFile.type}`,
    );

    Deno.writeFileSync(
      join(
        fileRoot,
        `raw.${
          BOTT_ATTACHMENT_TYPE_LOOKUP[
            rawFile.type as BottAttachmentType
          ].toLowerCase()
        }`,
      ),
      new Uint8Array(await rawFile.arrayBuffer()),
    );
  }

  let compressedFile: File | undefined = attachment.compressed;

  if (compressedFilePath && !compressedFile) {
    const compressedFileExtension = compressedFilePath.split(".").pop();

    compressedFile = new File(
      [Deno.readFileSync(compressedFilePath)],
      `compressed.${compressedFileExtension}`,
      {
        type: BottAttachmentType[
          compressedFileExtension
            ?.toUpperCase() as keyof typeof BottAttachmentType
        ],
      },
    );
  }

  if (!compressedFile) {
    if (!rawFile) {
      throw new Error(
        "File raw data is required when compressed data is missing.",
      );
    }

    const rawData = new Uint8Array(await rawFile.arrayBuffer());
    const rawType = rawFile.type as BottAttachmentType;

    switch (rawType) {
      case BottAttachmentType.TXT: {
        const textDecoder = new TextDecoder();
        let textContent = textDecoder.decode(rawData);
        const words = textContent.split(/\s+/);

        let data;
        if (words.length > MAX_TXT_WORDS) {
          textContent = words.slice(0, MAX_TXT_WORDS).join(" ") +
            "\n\n...(truncated)";
          data = new TextEncoder().encode(textContent);
        } else {
          data = rawData;
        }
        compressedFile = new File([data], "compressed.md", {
          type: BottAttachmentType.MD,
        });
        break;
      }
      case BottAttachmentType.HTML:
        compressedFile = await prepareHtmlAsMarkdown(rawData);
        break;
      case BottAttachmentType.PNG:
      case BottAttachmentType.JPEG:
        compressedFile = await prepareStaticImageAsWebp(rawData);
        break;
      case BottAttachmentType.MP3:
      case BottAttachmentType.WAV:
        compressedFile = await prepareAudioAsOpus(rawData);
        break;
      case BottAttachmentType.GIF:
      case BottAttachmentType.MP4:
        compressedFile = await prepareDynamicImageAsMp4(rawData);
        break;
      default:
        throw new Error(`Unsupported source type: ${rawType}`);
    }
  }

  if (!compressedFilePath && compressedFile) {
    log.debug(
      `Writing compressed file to disk: ${attachment.id}, type: ${compressedFile.type}`,
    );

    Deno.writeFileSync(
      join(
        fileRoot,
        `compressed.${
          BOTT_ATTACHMENT_TYPE_LOOKUP[
            compressedFile.type as BottAttachmentType
          ]
            .toLowerCase()
        }`,
      ),
      new Uint8Array(await compressedFile.arrayBuffer()),
    );
  }

  // Return properly typed variant based on what we have
  if (attachment.source) {
    if (compressedFile) {
      return {
        id: attachment.id,
        source: attachment.source,
        raw: rawFile,
        compressed: compressedFile,
        parent: attachment.parent,
      };
    } else if (rawFile) {
      return {
        id: attachment.id,
        source: attachment.source,
        raw: rawFile,
        parent: attachment.parent,
      };
    } else {
      return attachment;
    }
  } else {
    if (compressedFile) {
      return {
        id: attachment.id,
        raw: rawFile,
        compressed: compressedFile,
        parent: attachment.parent,
      };
    } else if (rawFile) {
      return {
        id: attachment.id,
        raw: rawFile,
        parent: attachment.parent,
      };
    } else {
      throw new Error(
        "Attachment must have either source URL or raw file data",
      );
    }
  }
};
