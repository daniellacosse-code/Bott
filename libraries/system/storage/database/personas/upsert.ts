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

import type { BottPersona } from "@bott/model";

import { commit } from "../commit.ts";
import { sql } from "../sql.ts";

export const upsertPersona = (persona: BottPersona): void => {
  const result = commit(
    sql`
      insert into personas (id, user_id, display_name, handle, space_id)
      values (
        ${persona.id},
        ${persona.user?.id ?? null},
        ${persona.displayName ?? null},
        ${persona.handle},
        ${persona.space.id}
      )
      on conflict(id) do update set
        user_id = excluded.user_id,
        display_name = excluded.display_name,
        handle = excluded.handle,
        space_id = excluded.space_id
    `,
  );

  if ("error" in result) {
    throw result.error;
  }
};
