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

import { parse } from "@std/yaml";
import { AnyShape } from "@bott/model";

export async function loadEnv(envName: string) {
  const text = await Deno.readTextFile(`.env.${envName}.yml`);
  const data = parse(text) as AnyShape;

  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== "string") {
      continue;
    }

    Deno.env.set(key, value);
  }
}
