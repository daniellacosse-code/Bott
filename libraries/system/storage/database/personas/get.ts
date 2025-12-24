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

export const getPersona = (personaId: string): BottPersona => {
  const result = commit(
    sql`
      select
        p.id as p_id,
        p.display_name as p_display_name,
        p.handle as p_handle,
        p.user_id as p_user_id,
        p.space_id as s_space_id,
        s.id as s_id,
        s.name as s_name,
        s.description as s_description,
        u.id as u_id,
        u.name as u_name,
        alt.id as alt_id,
        alt.display_name as alt_display_name,
        alt.handle as alt_handle,
        alt.space_id as alt_space_id,
        alt_s.id as alt_s_id,
        alt_s.name as alt_s_name,
        alt_s.description as alt_s_description
      from
        personas p
      left join
        spaces s on p.space_id = s.id
      left join
        users u on p.user_id = u.id
      left join -- get alternative personas
        personas alt on alt.user_id = p.user_id and alt.id != p.id
      left join
        spaces alt_s on alt.space_id = alt_s.id
      where
        p.id = ${personaId}
    `,
  );

  if ("error" in result) {
    throw result.error;
  }

  let persona: Partial<BottPersona>;

  { // any row will do
    const [{ p_id: id, p_display_name: displayName, p_handle: handle }] =
      result.reads;

    persona = {
      id,
      displayName,
      handle,
    };
  }

  {
    const [{ s_id: id, s_name: name, s_description: description }] = result.reads;

    persona.space = { id, name, description }
  }

  const altPersonas: Record<string, BottPersona> = {};
  for (const row of result.reads) {
    const { alt_id: altId } = row;
    if (!altId) continue;
    let space;

    {
      const { alt_s_id: id, alt_s_name: name, alt_s_description: description } =
        row;

      space = { id, name, description };
    }

    const { alt_id: id, alt_display_name: displayName, alt_handle: handle } =
      row;

    altPersonas[altId] = {
      id,
      displayName,
      handle,
      space,
      // Don't include user to avoid circular reference
    };
  }

  {
    const [{ u_id: id, u_name: name }] = result.reads;

    persona.user = {
      id,
      name,
      personas: altPersonas,
    };
  }

  return persona as BottPersona;
}