# Bott Formatting Standards

This document defines the standardized text formatting conventions used
internally by Bott when processing messages between Discord and the AI model
(Gemini).

## Purpose

These standards create a normalized, human-readable format for messages that is:

- **Easier for AI models to understand**: LLMs work better with human-readable
  text rather than platform-specific IDs
- **Platform-agnostic**: The same format can be used across different chat
  platforms
- **Reversible**: Messages can be converted back to platform-specific formats
  when needed

## Current Standards

### User Mentions

**Discord Format** → **Bott Format**

Discord uses numeric user IDs in angle brackets for mentions:

- `<@123456789>` → `@DisplayName`
- `<@!123456789>` → `@DisplayName` (nickname format)

Bott converts these to human-readable usernames using the user's **display
name** (their server nickname if set, otherwise their username).

**Examples:**

- Discord: `Hey <@123456789>, how are you?`
- Bott: `Hey @MoofyBoy, how are you?`

**Special Mentions:**

The following special mentions are preserved as-is in both directions:

- `@everyone` - Mentions all server members
- `@here` - Mentions all online server members

### Implementation Details

#### Incoming Messages (Discord → Bott)

When receiving messages from Discord, the `formatIncomingMentions()` function:

1. Identifies all user mentions in the format `<@USER_ID>` or `<@!USER_ID>`
2. Looks up each user's display name in the guild
3. Replaces mentions with `@DisplayName`
4. Preserves special mentions (`@everyone`, `@here`) unchanged

This happens in `libraries/discord/message/event.ts` when creating a
`BottEvent`.

#### Outgoing Messages (Bott → Discord)

When sending messages to Discord, the `formatOutgoingMentions()` function:

1. Identifies all `@username` patterns
2. Searches the guild for matching users by display name or username
3. Replaces matches with `<@USER_ID>` format
4. Preserves special mentions and unresolved mentions unchanged

This happens in `libraries/discord/bot/context.ts` in the `send()` function.

## Future Standards

As Bott evolves, additional formatting standards may be added for:

- Channel mentions (`#channel-name`)
- Role mentions (`@role-name`)
- Custom emojis (`:emoji_name:`)
- Message formatting (bold, italic, code blocks)

## See Also

- `libraries/discord/message/mentions.ts` - Implementation
- `libraries/discord/message/mentions.test.ts` - Test suite
