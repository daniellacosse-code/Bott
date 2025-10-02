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

import type { AnyBottEvent, BottUser } from "@bott/model";
import type { GuildTextBasedChannel } from "npm:discord.js";

/**
 * Formats outgoing message content by converting Bott's internal format
 * to platform-specific format (e.g., Discord mentions).
 *
 * Currently handles:
 * - User mentions: @Name → <@USER_ID>
 *
 * @param content - The message content in Bott's internal format
 * @param channel - The Discord channel to send the message in
 * @param userMap - Map of names to users from database (required)
 * @returns The content formatted for Discord
 */
export const formatOutgoingContent = (
  content: string,
  channel: GuildTextBasedChannel,
  userMap: Map<string, BottUser>,
): string => {
  return formatOutgoingMentions(content, channel, userMap);
};

/**
 * Formats incoming message content by converting platform-specific format
 * to Bott's internal format (e.g., Discord mentions to display names).
 *
 * Currently handles:
 * - User mentions: <@USER_ID> → @Name
 *
 * @param content - The message content in platform-specific format
 * @param users - Map of user IDs to user objects
 * @returns The content formatted for Bott's internal use
 */
export const formatIncomingContent = (
  content: string,
  users: Map<string, BottUser> | BottUser[],
): string => {
  const userMap = Array.isArray(users)
    ? new Map(users.map((u) => [u.id, u]))
    : users;
  return formatIncomingMentions(content, userMap);
};

/**
 * Converts platform-specific user mentions to readable format.
 *
 * Examples:
 * - <@123456789> → @MoofyBoy
 * - <@!123456789> → @MoofyBoy (nickname format)
 * - @everyone → @everyone (preserved)
 *
 * @param content - The message content containing platform-specific mentions
 * @param userMap - Map of user IDs to user objects
 * @returns The content with formatted mentions
 */
const formatIncomingMentions = (
  content: string,
  userMap: Map<string, BottUser>,
): string => {
  // Find all user mentions in the format <@USER_ID> or <@!USER_ID>
  const mentionPattern = /<@!?(\d+)>/g;

  return content.replace(mentionPattern, (match, userId) => {
    const user = userMap.get(userId);
    if (user) {
      return `@${user.name}`;
    }
    // If user not found, keep original format
    return match;
  });
};

/**
 * Converts readable mentions back to platform-specific format.
 *
 * Examples:
 * - @MoofyBoy → <@123456789>
 * - @everyone → @everyone (preserved)
 *
 * @param content - The message content with readable mentions
 * @param channel - The Discord channel to resolve users in
 * @param userMap - Map of names to users from database (required)
 * @returns The content with platform-specific mentions
 */
const formatOutgoingMentions = (
  content: string,
  channel: GuildTextBasedChannel,
  userMap: Map<string, BottUser>,
): string => {
  // Special mentions are already in the correct format
  // @everyone and @here work as-is in Discord

  // Find all @ mentions that aren't special mentions
  // Pattern: @word (but not @everyone or @here)
  const mentionPattern = /@(\w+)/g;
  const matches = Array.from(content.matchAll(mentionPattern));

  if (matches.length === 0) {
    return content;
  }

  const nameToId: Map<string, string> = new Map();

  // Build a map of names to user IDs from database
  for (const match of matches) {
    const name = match[1];

    // Skip special mentions
    if (name === "everyone" || name === "here") {
      continue;
    }

    if (nameToId.has(name)) {
      continue;
    }

    // Look up user in provided userMap from database
    const user = userMap.get(name);
    if (user) {
      nameToId.set(name, user.id);
      continue;
    }

    // Try case-insensitive lookup
    for (const [userName, userObj] of userMap.entries()) {
      if (userName.toLowerCase() === name.toLowerCase()) {
        nameToId.set(name, userObj.id);
        break;
      }
    }
  }

  // Replace formatted mentions with Discord mentions
  let formattedContent = content;
  for (const [name, userId] of nameToId.entries()) {
    // Use word boundaries to avoid partial replacements
    const mentionRegex = new RegExp(`@${name}\\b`, "g");
    formattedContent = formattedContent.replace(mentionRegex, `<@${userId}>`);
  }

  return formattedContent;
};
