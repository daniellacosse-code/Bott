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

import { join } from "jsr:@std/path";

import { type BottOutputFile, BottOutputFileType } from "@bott/model";
import { validateFilePath, sanitizeString } from "@bott/security";

import { STORAGE_FILE_OUTPUT_ROOT } from "../../start.ts";

export const storeOutputFile = (
  data: Uint8Array,
  type: BottOutputFileType,
  filename?: string,
): BottOutputFile => {
  if (!data || !(data instanceof Uint8Array)) {
    throw new Error("Output file data must be a Uint8Array");
  }

  if (!Object.values(BottOutputFileType).includes(type)) {
    throw new Error(`Invalid output file type: ${type}`);
  }

  // Security: Validate data size (limit to 500MB for output files)
  const MAX_OUTPUT_SIZE = 500 * 1024 * 1024;
  if (data.length > MAX_OUTPUT_SIZE) {
    throw new Error(`Output file too large: ${data.length} bytes (max: ${MAX_OUTPUT_SIZE})`);
  }

  const id = crypto.randomUUID();
  let name = filename ?? id;
  
  // Security: Sanitize filename
  name = sanitizeString(name, { allowHtml: false, maxLength: 100 });
  if (!name || name.trim() === "") {
    name = id;
  }

  let path = type + "/" + name;

  for (const [key, value] of Object.entries(BottOutputFileType)) {
    if (value === type) {
      path += "." + key.toLowerCase();
      break;
    }
  }

  // Security: Validate the output path
  try {
    validateFilePath(path, STORAGE_FILE_OUTPUT_ROOT);
  } catch (error) {
    throw new Error(`Invalid output file path: ${error.message}`);
  }

  const fullDirectoryPath = join(STORAGE_FILE_OUTPUT_ROOT, type);
  const fullFilePath = join(STORAGE_FILE_OUTPUT_ROOT, path);

  Deno.mkdirSync(fullDirectoryPath, { recursive: true });
  Deno.writeFileSync(fullFilePath, data);

  return {
    id,
    data,
    type,
    path,
  };
};
