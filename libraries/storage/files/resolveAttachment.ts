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
  type UnresolvedBottEventAttachment,
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
 * Fully resolves an attachment by loading file data from disk or remote sources.
 * @param attachment Unresolved attachment with metadata
 * @returns Fully resolved attachment with File objects loaded
 */
export const resolveAttachment = async (
  attachment: UnresolvedBottEventAttachment,
): Promise<BottEventAttachment> => {
  const fileRoot = join(STORAGE_FILE_ROOT, attachment.id);

  Deno.mkdirSync(fileRoot, { recursive: true });

  // Load raw file
  let rawFile: File | undefined;
  const rawPath = attachment.raw?.path ?? attachment.originalSource;

  if (rawPath) {
    if (rawPath.protocol === "file:") {
      // Load from disk
      const diskPath = rawPath.pathname;
      try {
        const fileExtension = diskPath.split(".").pop();
        rawFile = new File(
          [Deno.readFileSync(diskPath)],
          `raw.${fileExtension}`,
          {
            type: BottAttachmentType[
              fileExtension?.toUpperCase() as keyof typeof BottAttachmentType
            ],
          },
        );
      } catch (e) {
        log.warn(`Failed to read raw file from ${diskPath}: ${e}`);
      }
    } else {
      // Fetch from remote URL
      throwIfUnsafeUrl(rawPath);

      log.debug(`Fetching raw file from source URL: ${rawPath}`);

      const response = await fetch(rawPath, {
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
  }

  // Save raw file to disk if not already there
  if (rawFile && !attachment.raw?.path) {
    const extension = BOTT_ATTACHMENT_TYPE_LOOKUP[
      rawFile.type as BottAttachmentType
    ].toLowerCase();
    const rawDiskPath = join(fileRoot, `raw.${extension}`);

    log.debug(
      `Writing raw file to disk: ${attachment.id}, type: ${rawFile.type}`,
    );

    Deno.writeFileSync(
      rawDiskPath,
      new Uint8Array(await rawFile.arrayBuffer()),
    );
  }

  // Load compressed file
  let compressedFile: File | undefined;
  const compressedPath = attachment.compressed?.path;

  if (compressedPath && compressedPath.protocol === "file:") {
    // Load from disk
    const diskPath = compressedPath.pathname;
    try {
      const fileExtension = diskPath.split(".").pop();
      compressedFile = new File(
        [Deno.readFileSync(diskPath)],
        `compressed.${fileExtension}`,
        {
          type: BottAttachmentType[
            fileExtension?.toUpperCase() as keyof typeof BottAttachmentType
          ],
        },
      );
    } catch (e) {
      log.warn(`Failed to read compressed file from ${diskPath}: ${e}`);
    }
  }

  // Generate compressed from raw if needed
  if (!compressedFile && rawFile) {
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

  // Save compressed file to disk if not already there
  if (compressedFile && !attachment.compressed?.path) {
    const extension = BOTT_ATTACHMENT_TYPE_LOOKUP[
      compressedFile.type as BottAttachmentType
    ].toLowerCase();
    const compressedDiskPath = join(fileRoot, `compressed.${extension}`);

    log.debug(
      `Writing compressed file to disk: ${attachment.id}, type: ${compressedFile.type}`,
    );

    Deno.writeFileSync(
      compressedDiskPath,
      new Uint8Array(await compressedFile.arrayBuffer()),
    );
  }

  // Build resolved attachment
  const resolved: BottEventAttachment = {
    id: attachment.id,
    parent: attachment.parent,
    originalSource: attachment.originalSource,
  };

  if (rawFile) {
    resolved.raw = {
      path: attachment.raw?.path ?? (
        attachment.originalSource ? undefined : 
        new URL(`file://${join(fileRoot, `raw.${BOTT_ATTACHMENT_TYPE_LOOKUP[rawFile.type as BottAttachmentType].toLowerCase()}`)}`)
      ),
      file: rawFile,
    };
  }

  if (compressedFile) {
    resolved.compressed = {
      path: attachment.compressed?.path ?? 
        new URL(`file://${join(fileRoot, `compressed.${BOTT_ATTACHMENT_TYPE_LOOKUP[compressedFile.type as BottAttachmentType].toLowerCase()}`)}`),
      file: compressedFile,
    };
  }

  return resolved;
};
