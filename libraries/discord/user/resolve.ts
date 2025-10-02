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

import type { Guild, User } from "npm:discord.js";

/**
 * Resolves the display name for a Discord user.
 * Attempts to fetch the guild member's display name (nickname or username).
 * Falls back to username if fetching fails.
 *
 * @param user - The Discord user
 * @param guild - The Discord guild to fetch member from
 * @returns The display name to use
 */
export const resolveDisplayName = async (
  user: User,
  guild: Guild,
): Promise<string> => {
  try {
    const member = await guild.members.fetch(user.id);
    return member.displayName;
  } catch {
    return user.username;
  }
};
