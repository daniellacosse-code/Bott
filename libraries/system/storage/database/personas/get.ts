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

import type { BottPersona, BottSpace } from "@bott/model";

import { commit } from "../commit.ts";
import { sql } from "../sql.ts";

export const getPersona = async (
  personaId: string,
  space: BottSpace,
): Promise<BottPersona | undefined> => {
  const result = commit(
    sql`
      select
        p.id as p_id,
        p.display_name as p_display_name,
        p.handle as p_handle,
        p.user_id as p_user_id,
        u.id as u_id,
        u.name as u_name
      from
        personas p
      left join
        users u on p.user_id = u.id
      where
        p.id = ${personaId}
        and p.space_id = ${space.id}
    `,
  );

  if ("error" in result || result.reads.length === 0) {
    return undefined;
  }

  const row = result.reads[0];

  // Get other personas for this user (avoid circular references)
  const personas: Record<string, BottPersona> = {};

  if (row.p_user_id) {
    const otherPersonasResult = commit(
      sql`
        select
          p.id as p_id,
          p.display_name as p_display_name,
          p.handle as p_handle,
          p.space_id as p_space_id,
          s.name as s_name,
          s.description as s_description
        from
          personas p
        left join
          spaces s on p.space_id = s.id
        where
          p.user_id = ${row.p_user_id}
          and p.id != ${personaId}
      `,
    );

    if (!("error" in otherPersonasResult)) {
      for (const otherRow of otherPersonasResult.reads) {
        personas[otherRow.p_id] = {
          id: otherRow.p_id,
          displayName: otherRow.p_display_name,
          handle: otherRow.p_handle,
          space: {
            id: otherRow.p_space_id,
            name: otherRow.s_name,
            description: otherRow.s_description,
          },
          // Don't include user to avoid circular reference
        };
      }
    }
  }

  return {
    id: row.p_id,
    displayName: row.p_display_name,
    handle: row.p_handle,
    space,
    user: row.u_id
      ? {
        id: row.u_id,
        name: row.u_name,
        personas,
      }
      : undefined,
  };
};
