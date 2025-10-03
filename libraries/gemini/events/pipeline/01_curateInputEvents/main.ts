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

import { Handlebars } from "https://deno.land/x/handlebars/mod.ts";

import systemPromptTemplate from "./systemPrompt.md.hbs";

import type { EventPipelineProcessor } from "../types.ts";

// phase one - curate incoming events
//   for each
//     prune?
//     score?
//       if scored, focus?

export const curateInputEvents: EventPipelineProcessor = async (context) => {
  const systemPrompt = await new Handlebars().renderView(
    systemPromptTemplate,
    context,
  );

  return context;

  // const modelUserId = context.user.id;
  // const contents: Content[] = [];
  // let pointer = inputEvents.length;

  // // We only want the model to respond to events that haven't been scored yet:
  // const resourceAccumulator = {
  //   estimatedTokens: 0,
  //   unseenEvents: 0,
  //   audioFiles: 0,
  //   videoFiles: 0,
  // };
  // while (pointer--) {
  //   const event = {
  //     ...inputEvents[pointer],
  //     details: { ...inputEvents[pointer].details },
  //   };

  //   if (
  //     event.type === BottEventType.ACTION_CALL ||
  //     event.type === BottEventType.ACTION_RESULT
  //   ) {
  //     // Skip these events for now.
  //     continue;
  //   }

  //   // Remove unnecessary parent files from events:
  //   if (event.parent) {
  //     delete event.parent.files;
  //   }

  //   // Prune old, stale files that bloat the context window:
  //   if (event.files?.length) {
  //     const filesToKeep = [];
  //     for (const file of event.files) {
  //       let shouldPrune = false;

  //       if (!file.compressed) {
  //         continue;
  //       }

  //       if (
  //         resourceAccumulator.estimatedTokens +
  //             file.compressed.data.byteLength >
  //           INPUT_FILE_TOKEN_LIMIT
  //       ) {
  //         shouldPrune = true;
  //       } else if (
  //         file.compressed.type === BottFileType.OPUS &&
  //         resourceAccumulator.audioFiles >= INPUT_FILE_AUDIO_COUNT_LIMIT
  //       ) {
  //         shouldPrune = true;
  //       } else if (
  //         file.compressed.type === BottFileType.MP4 &&
  //         resourceAccumulator.videoFiles >= INPUT_FILE_VIDEO_COUNT_LIMIT
  //       ) {
  //         shouldPrune = true;
  //       }

  //       if (shouldPrune) {
  //         continue;
  //       }

  //       filesToKeep.push(file);

  //       if (file.compressed.type === BottFileType.OPUS) {
  //         resourceAccumulator.audioFiles++;
  //       } else if (file.compressed.type === BottFileType.MP4) {
  //         resourceAccumulator.videoFiles++;
  //       }

  //       resourceAccumulator.estimatedTokens += file.compressed.data.byteLength;
  //     }

  //     if (filesToKeep.length) {
  //       event.files = filesToKeep as BottFile[];
  //     } else {
  //       delete event.files;
  //     }
  //   }

  //   if (!event.details.scores) {
  //     resourceAccumulator.unseenEvents++;
  //   }

  //   contents.unshift(_transformBottEventToContent(event, modelUserId));

  //   if (contents.length >= INPUT_EVENT_LIMIT) {
  //     break;
  //   }
  // }

  // if (contents.length === 0) {
  //   log.debug("No events to process");
  //   return;
  // }
};
