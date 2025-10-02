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

import type { BottUser } from "@bott/model";
import { sql } from "../sql.ts";
import { commit } from "../commit.ts";

/**
 * Gets users by their IDs from the database.
 *
 * @param userIds - Array of user IDs to fetch
 * @returns Map of user ID to BottUser
 */
export const getUsersByIds = (
  ...userIds: string[]
): Map<string, BottUser> => {
  if (userIds.length === 0) {
    return new Map();
  }

  const results = commit(
    sql`select id, name from users where id in (${userIds})`,
  );

  const userMap = new Map<string, BottUser>();
  if ("error" in results) {
    return userMap;
  }

  for (const row of results.reads) {
    userMap.set(row.id as string, {
      id: row.id as string,
      name: row.name as string,
    });
  }

  return userMap;
};

/**
 * Gets all users in a space from the database.
 * Queries through events and channels to find users who have interacted in the space.
 *
 * @param spaceId - The space ID to get users for
 * @returns Map of user name to BottUser
 */
export const getUsersBySpaceId = (
  spaceId: string,
): Map<string, BottUser> => {
  const results = commit(
    sql`
      select distinct u.id, u.name
      from users u
      inner join events e on u.id = e.user_id
      inner join channels c on e.channel_id = c.id
      where c.space_id = ${spaceId}
    `,
  );

  const userMap = new Map<string, BottUser>();
  if ("error" in results) {
    return userMap;
  }

  for (const row of results.reads) {
    const user = {
      id: row.id as string,
      name: row.name as string,
    };
    // Map by name for easier mention lookups
    userMap.set(user.name, user);
  }

  return userMap;
};
