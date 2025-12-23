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
        u.name as u_name,
        op.id as op_id,
        op.display_name as op_display_name,
        op.handle as op_handle,
        op.space_id as op_space_id,
        s.name as s_name,
        s.description as s_description
      from
        personas p
      left join
        users u on p.user_id = u.id
      left join
        personas op on op.user_id = p.user_id and op.id != p.id
      left join
        spaces s on op.space_id = s.id
      where
        p.id = ${personaId}
        and p.space_id = ${space.id}
    `,
  );

  if ("error" in result || result.reads.length === 0) {
    return undefined;
  }

  const row = result.reads[0];

  // Build personas map from joined results (avoid circular references)
  const personas: Record<string, BottPersona> = {};
  for (const personaRow of result.reads) {
    if (personaRow.op_id) {
      personas[personaRow.op_id] = {
        id: personaRow.op_id,
        displayName: personaRow.op_display_name,
        handle: personaRow.op_handle,
        space: {
          id: personaRow.op_space_id,
          name: personaRow.s_name,
          description: personaRow.s_description,
        },
        // Don't include user to avoid circular reference
      };
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
