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

import { STORAGE_FILE_SIZE_LIMIT } from "@bott/constants";
import { BottAttachmentType } from "@bott/events";
// @deno-types="npm:@types/pdf-parse@^1.1.4"
import pdfParse from "pdf-parse";

export const preparePdfAsText = async (
  file: File,
  attachmentId: string,
): Promise<File> => {
  const pdfData = await file.arrayBuffer();

  const parsed = await pdfParse(pdfData);

  if (!parsed || !parsed.text) {
    throw new Error("No text extracted from PDF.");
  }

  let result = parsed.text;

  if (result.length > STORAGE_FILE_SIZE_LIMIT) {
    result = result.substring(0, STORAGE_FILE_SIZE_LIMIT) +
      "\n\n...(truncated)";
  }

  return new File(
    [new TextEncoder().encode(result)],
    `${attachmentId}.compressed.txt`,
    { type: BottAttachmentType.TXT },
  );
};
