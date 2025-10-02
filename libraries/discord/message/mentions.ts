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

import type { GuildTextBasedChannel, Message } from "npm:discord.js";

/**
 * Represents a mapping between user IDs and their display names.
 */
type UserMentionMap = Map<string, string>;

/**
 * Converts Discord user mentions (<@USER_ID>) to formatted mentions (@DisplayName)
 * for better LLM processing.
 *
 * This function:
 * - Replaces `<@USER_ID>` with `@DisplayName` using guild member display names
 * - Preserves special mentions like `@everyone` and `@here` as-is
 * - Handles both standard `<@ID>` and nickname `<@!ID>` formats
 *
 * @param content - The message content containing Discord mentions
 * @param message - The Discord message object to extract user information
 * @returns The content with formatted mentions
 */
export const formatIncomingMentions = async (
  content: string,
  message: Message<true>,
): Promise<string> => {
  // Handle special mentions - they're already in the right format
  // @everyone and @here don't need conversion

  // Find all user mentions in the format <@USER_ID> or <@!USER_ID>
  const mentionPattern = /<@!?(\d+)>/g;
  const matches = Array.from(content.matchAll(mentionPattern));

  if (matches.length === 0) {
    return content;
  }

  const userMap: UserMentionMap = new Map();

  // Build a map of user IDs to display names
  for (const match of matches) {
    const userId = match[1];

    if (userMap.has(userId)) {
      continue;
    }

    try {
      // Try to get the guild member for their display name (nickname or username)
      const member = await message.guild.members.fetch(userId);
      // Use displayName which automatically picks nickname over username
      userMap.set(userId, member.displayName);
    } catch (_error) {
      // If we can't fetch the user, try to get from message mentions
      const mentionedUser = message.mentions.users.get(userId);
      if (mentionedUser) {
        userMap.set(userId, mentionedUser.username);
      } else {
        // Fallback: keep the original mention format
        userMap.set(userId, `<@${userId}>`);
      }
    }
  }

  // Replace all mentions with formatted versions
  let formattedContent = content;
  for (const [userId, displayName] of userMap.entries()) {
    // Replace both <@USER_ID> and <@!USER_ID> formats
    const mentionRegex = new RegExp(`<@!?${userId}>`, "g");
    formattedContent = formattedContent.replace(
      mentionRegex,
      `@${displayName}`,
    );
  }

  return formattedContent;
};

/**
 * Converts formatted mentions (@DisplayName) back to Discord mentions (<@USER_ID>)
 * before sending messages to Discord.
 *
 * This function:
 * - Replaces `@DisplayName` with `<@USER_ID>` when a matching user is found
 * - Preserves special mentions like `@everyone` and `@here` as-is
 * - Only converts mentions where we can resolve the user ID
 *
 * @param content - The message content with formatted mentions
 * @param channel - The Discord channel to send the message in
 * @returns The content with Discord-formatted mentions
 */
export const formatOutgoingMentions = async (
  content: string,
  channel: GuildTextBasedChannel,
): Promise<string> => {
  // Special mentions are already in the correct format
  // @everyone and @here work as-is in Discord

  // Find all @ mentions that aren't special mentions
  // Pattern: @word (but not @everyone or @here)
  const mentionPattern = /@(\w+)/g;
  const matches = Array.from(content.matchAll(mentionPattern));

  if (matches.length === 0) {
    return content;
  }

  const guild = channel.guild;
  const displayNameToId: Map<string, string> = new Map();

  // Build a map of display names to user IDs
  for (const match of matches) {
    const displayName = match[1];

    // Skip special mentions
    if (displayName === "everyone" || displayName === "here") {
      continue;
    }

    if (displayNameToId.has(displayName)) {
      continue;
    }

    try {
      // Search for a member with this display name (nickname) or username
      const members = await guild.members.fetch({
        query: displayName,
        limit: 10,
      });

      // Try to find exact match first
      let foundMember = members.find(
        (m) => m.displayName === displayName || m.user.username === displayName,
      );

      // If no exact match, try case-insensitive
      if (!foundMember) {
        const lowerDisplayName = displayName.toLowerCase();
        foundMember = members.find(
          (m) =>
            m.displayName.toLowerCase() === lowerDisplayName ||
            m.user.username.toLowerCase() === lowerDisplayName,
        );
      }

      if (foundMember) {
        displayNameToId.set(displayName, foundMember.id);
      }
    } catch (_error) {
      // If we can't fetch members, skip this mention
      continue;
    }
  }

  // Replace formatted mentions with Discord mentions
  let formattedContent = content;
  for (const [displayName, userId] of displayNameToId.entries()) {
    // Use word boundaries to avoid partial replacements
    const mentionRegex = new RegExp(`@${displayName}\\b`, "g");
    formattedContent = formattedContent.replace(mentionRegex, `<@${userId}>`);
  }

  return formattedContent;
};
