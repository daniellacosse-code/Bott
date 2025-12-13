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

import ejs from "ejs";
import { BottGlobalSettings, BottUser } from "@bott/model";

import * as reasons from "./reasons.ts";

export const getDefaultGlobalSettings = (
  context: { user: BottUser },
): BottGlobalSettings => {
  const identityTemplate = Deno.readTextFileSync(
    new URL("./identity.md.ejs", import.meta.url),
  );

  return {
    identity: ejs.render(identityTemplate, context),
    reasons: {
      input: [
        reasons.whenAddressed(context.user),
        reasons.checkFacts,
      ],
      output: [
        reasons.ensurePotentialImpact,
      ],
    },
  };
};
