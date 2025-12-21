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

import type { BottAction } from "@bott/actions";
import { createAction } from "@bott/actions";
import {
  GEMINI_EVENT_MODEL,
  GEMINI_MOVIE_MODEL,
  GEMINI_PHOTO_MODEL,
  GEMINI_RATING_MODEL,
  GEMINI_SONG_MODEL,
} from "@bott/constants";
import {
  movieAction,
  photoAction,
  responseAction,
  songAction,
} from "@bott/gemini";

const actions: Record<string, BottAction> = {};

if (GEMINI_EVENT_MODEL && GEMINI_RATING_MODEL) {
  actions[responseAction.name] = responseAction;
}

if (GEMINI_SONG_MODEL) {
  actions[songAction.name] = songAction;
}

if (GEMINI_PHOTO_MODEL) {
  actions[photoAction.name] = photoAction;
}

if (GEMINI_MOVIE_MODEL) {
  actions[movieAction.name] = movieAction;
}

actions.help = createAction(async function* () {
  // TODO
}, {
  name: "help",
  instructions: "Show help information.",
});

export default actions;
