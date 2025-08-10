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

import { type BottInputFile, BottInputFileType } from "@bott/model";
import { validateFilePath, validateFileContent, sanitizeString } from "@bott/security";

import { commit } from "../../data/commit.ts";
import { prepareHtmlAsMarkdown } from "./prepare/html.ts";
import {
  prepareAudioAsOpus,
  prepareDynamicImageAsMp4,
  prepareStaticImageAsWebp,
} from "./prepare/ffmpeg.ts";
import { sql } from "../../data/sql.ts";
import { STORAGE_FILE_INPUT_ROOT } from "../../start.ts";
import { SupportedRawFileType } from "../types.ts";

export const _getResponseContentType = (response: Response): string => {
  const contentTypeHeader = response.headers.get("content-type");
  if (!contentTypeHeader) return "";
  return contentTypeHeader.split(";")[0].trim();
};

const _inputFileCache = new Map<string, BottInputFile>();

const _getInputFile = (url: URL): BottInputFile | undefined => {
  if (_inputFileCache.has(url.toString())) {
    // If this file is a part of a batch write,
    // the file's data is cached in memory but not written in the DB yet.
    return _inputFileCache.get(url.toString());
  }

  const data = commit(
    sql`
      select * from input_files where url = ${url.toString()};
    `,
  );

  if (!("reads" in data) || data.reads.length === 0) return;

  const [file] = data.reads;

  const result = {
    url: new URL(file.url),
    path: file.path,
    type: file.type as BottInputFileType,
    data: Deno.readFileSync(join(STORAGE_FILE_INPUT_ROOT, file.path)),
  };

  _inputFileCache.set(url.toString(), result);

  return result;
};

const MAX_TXT_WORDS = 600;
const TRUNCATED_MARKER = " (truncated)";

// Security: Maximum URL length to prevent abuse
const MAX_URL_LENGTH = 2048;

// Security: Maximum file size for downloads (100MB)
const MAX_DOWNLOAD_SIZE = 100 * 1024 * 1024;

export const storeNewInputFile = async (
  url: URL,
): Promise<BottInputFile> => {
  if (!STORAGE_FILE_INPUT_ROOT) {
    throw new Error(
      "Storage has not been started: FS_FILE_INPUT_ROOT is not defined",
    );
  }

  // Security: Validate URL
  if (url.toString().length > MAX_URL_LENGTH) {
    throw new Error("URL is too long");
  }

  // Security: Only allow HTTP/HTTPS protocols
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`Unsupported URL protocol: ${url.protocol}`);
  }

  const existingFile = _getInputFile(url);
  if (existingFile) {
    return existingFile;
  }

  // Resolve source URL with security headers:
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Bott/1.0 (Security-Hardened File Fetcher)",
    },
    redirect: "follow",
    // Security: Set timeout to prevent hanging
    signal: AbortSignal.timeout(30000), // 30 second timeout
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  // Security: Check content length before downloading
  const contentLengthHeader = response.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = parseInt(contentLengthHeader, 10);
    if (contentLength > MAX_DOWNLOAD_SIZE) {
      throw new Error(`File too large: ${contentLength} bytes (max: ${MAX_DOWNLOAD_SIZE})`);
    }
  }

  const sourceData = new Uint8Array(await response.arrayBuffer());
  
  // Security: Double-check actual size
  if (sourceData.length > MAX_DOWNLOAD_SIZE) {
    throw new Error(`File too large: ${sourceData.length} bytes (max: ${MAX_DOWNLOAD_SIZE})`);
  }

  const sourceType = _getResponseContentType(response);

  // Security: Validate file content
  try {
    validateFileContent(sourceData, sourceType);
  } catch (error) {
    throw new Error(`File content validation failed: ${error.message}`);
  }

  // Prepare file of type:
  let resultData, resultType;
  switch (sourceType) {
    case SupportedRawFileType.TXT:
      {
        const textDecoder = new TextDecoder();
        let textContent = textDecoder.decode(sourceData);
        
        // Security: Sanitize text content
        textContent = sanitizeString(textContent, { allowHtml: false, maxLength: 50000 });
        
        const words = textContent.split(/\s+/);

        if (words.length > MAX_TXT_WORDS) {
          textContent = words.slice(0, MAX_TXT_WORDS).join(" ") +
            TRUNCATED_MARKER;
          resultData = new TextEncoder().encode(textContent);
        } else {
          resultData = new TextEncoder().encode(textContent);
        }
      }
      resultType = BottInputFileType.MD;
      break;
    case SupportedRawFileType.HTML:
      [resultData, resultType] = await prepareHtmlAsMarkdown(sourceData);
      break;
    case SupportedRawFileType.PNG:
    case SupportedRawFileType.JPEG:
      [resultData, resultType] = await prepareStaticImageAsWebp(sourceData);
      break;
    case SupportedRawFileType.MP3:
    case SupportedRawFileType.WAV:
      [resultData, resultType] = await prepareAudioAsOpus(sourceData);
      break;
    case SupportedRawFileType.GIF:
    case SupportedRawFileType.MP4:
      [resultData, resultType] = await prepareDynamicImageAsMp4(sourceData);
      break;
    default:
      throw new Error(`Unsupported source type: ${sourceType}`);
  }

  // Security: Validate result file path and generate safe filename
  let path = resultType as string;
  let name = url.pathname.split("/").pop() || "index";
  
  // Security: Sanitize filename
  name = sanitizeString(name, { allowHtml: false, maxLength: 100 });
  if (!name || name.trim() === "") {
    name = "file";
  }

  for (const [key, value] of Object.entries(BottInputFileType)) {
    if (resultType === value) {
      name += `.${
        Math.random().toString(36).substring(7)
      }.${key.toLowerCase()}`;
      break;
    }
  }

  path += `/${name}`;

  // Security: Validate the final path
  try {
    validateFilePath(path, STORAGE_FILE_INPUT_ROOT);
  } catch (error) {
    throw new Error(`Invalid file path generated: ${error.message}`);
  }

  const fullInputPath = join(STORAGE_FILE_INPUT_ROOT, resultType);
  const fullFilePath = join(STORAGE_FILE_INPUT_ROOT, path);

  Deno.mkdirSync(fullInputPath, {
    recursive: true,
  });
  Deno.writeFileSync(fullFilePath, resultData);

  // Return BottInputFile:
  const file = {
    url,
    path,
    type: resultType,
    data: resultData,
  };

  _inputFileCache.set(url.toString(), file);

  return file;
};
