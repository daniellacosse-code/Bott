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

import { assertEquals } from "jsr:@std/assert/equals";
import type { GuildTextBasedChannel, Message } from "npm:discord.js";
import { formatIncomingMentions, formatOutgoingMentions } from "./mentions.ts";

// Mock Discord.js types
type MockUser = {
  displayName: string;
  username?: string;
};

type MockMember = {
  id: string;
  displayName: string;
  user: { username: string };
};

type MockMessage = {
  guild: {
    members: {
      fetch: (id: string | { query: string; limit: number }) => Promise<
        MockMember | MockMember[]
      >;
    };
  };
  mentions: {
    users: {
      get: (id: string) => { username: string } | undefined;
    };
  };
};

type MockChannel = {
  guild: {
    members: {
      fetch: (options: { query: string; limit: number }) => Promise<
        MockMember[]
      >;
    };
  };
};

// Helper to create mock Discord message
function createMockMessage(
  userMap: Record<string, MockUser>,
): MockMessage {
  return {
    guild: {
      members: {
        fetch: (id: string) => {
          const user = userMap[id];
          if (!user) {
            throw new Error("User not found");
          }
          return Promise.resolve({
            displayName: user.displayName,
            user: { username: user.username || user.displayName },
          } as MockMember);
        },
      },
    },
    mentions: {
      users: {
        get: (id: string) => {
          const user = userMap[id];
          return user
            ? { username: user.username || user.displayName }
            : undefined;
        },
      },
    },
  } as MockMessage;
}

// Helper to create mock Discord channel
function createMockChannel(
  userMap: Record<
    string,
    { id: string; displayName: string; username?: string }
  >,
): MockChannel {
  return {
    guild: {
      members: {
        fetch: ({ query }: { query: string; limit: number }) => {
          const results = Object.entries(userMap)
            .filter(
              ([_, user]) =>
                user.displayName === query ||
                user.username === query ||
                user.displayName.toLowerCase() === query.toLowerCase() ||
                (user.username &&
                  user.username.toLowerCase() === query.toLowerCase()),
            )
            .map(([_, user]) => ({
              id: user.id,
              displayName: user.displayName,
              user: { username: user.username || user.displayName },
            } as MockMember));

          return Promise.resolve(results);
        },
      },
    },
  } as MockChannel;
}

Deno.test("formatIncomingMentions - empty string", async () => {
  const message = createMockMessage({});
  assertEquals(
    await formatIncomingMentions("", message as unknown as Message<true>),
    "",
  );
});

Deno.test("formatIncomingMentions - no mentions", async () => {
  const message = createMockMessage({});
  const content = "Hello, this is a test message.";
  assertEquals(
    await formatIncomingMentions(content, message as unknown as Message<true>),
    content,
  );
});

Deno.test("formatIncomingMentions - single user mention", async () => {
  const message = createMockMessage({
    "123456789": { displayName: "MoofyBoy", username: "moofyboy" },
  });
  const content = "Hey <@123456789>, how are you?";
  assertEquals(
    await formatIncomingMentions(content, message as unknown as Message<true>),
    "Hey @MoofyBoy, how are you?",
  );
});

Deno.test("formatIncomingMentions - user mention with nickname format", async () => {
  const message = createMockMessage({
    "123456789": { displayName: "MoofyBoy", username: "moofyboy" },
  });
  const content = "Hey <@!123456789>, how are you?";
  assertEquals(
    await formatIncomingMentions(content, message as unknown as Message<true>),
    "Hey @MoofyBoy, how are you?",
  );
});

Deno.test("formatIncomingMentions - multiple mentions of same user", async () => {
  const message = createMockMessage({
    "123456789": { displayName: "MoofyBoy", username: "moofyboy" },
  });
  const content = "<@123456789> told <@123456789> about it";
  assertEquals(
    await formatIncomingMentions(content, message as unknown as Message<true>),
    "@MoofyBoy told @MoofyBoy about it",
  );
});

Deno.test("formatIncomingMentions - multiple different users", async () => {
  const message = createMockMessage({
    "123456789": { displayName: "MoofyBoy", username: "moofyboy" },
    "987654321": { displayName: "CoolCat", username: "coolcat" },
  });
  const content = "<@123456789> and <@987654321> are friends";
  assertEquals(
    await formatIncomingMentions(content, message as unknown as Message<true>),
    "@MoofyBoy and @CoolCat are friends",
  );
});

Deno.test("formatIncomingMentions - special mention @everyone", async () => {
  const message = createMockMessage({});
  const content = "Hey @everyone, meeting starts now!";
  assertEquals(
    await formatIncomingMentions(content, message as unknown as Message<true>),
    "Hey @everyone, meeting starts now!",
  );
});

Deno.test("formatIncomingMentions - special mention @here", async () => {
  const message = createMockMessage({});
  const content = "@here please check this out";
  assertEquals(
    await formatIncomingMentions(content, message as unknown as Message<true>),
    "@here please check this out",
  );
});

Deno.test("formatIncomingMentions - mixed user and special mentions", async () => {
  const message = createMockMessage({
    "123456789": { displayName: "MoofyBoy", username: "moofyboy" },
  });
  const content = "@everyone, <@123456789> has an announcement";
  assertEquals(
    await formatIncomingMentions(content, message as unknown as Message<true>),
    "@everyone, @MoofyBoy has an announcement",
  );
});

Deno.test("formatOutgoingMentions - empty string", async () => {
  const channel = createMockChannel({});
  assertEquals(
    await formatOutgoingMentions(
      "",
      channel as unknown as GuildTextBasedChannel,
    ),
    "",
  );
});

Deno.test("formatOutgoingMentions - no mentions", async () => {
  const channel = createMockChannel({});
  const content = "Hello, this is a test message.";
  assertEquals(
    await formatOutgoingMentions(
      content,
      channel as unknown as GuildTextBasedChannel,
    ),
    content,
  );
});

Deno.test("formatOutgoingMentions - single user mention", async () => {
  const channel = createMockChannel({
    "123456789": {
      id: "123456789",
      displayName: "MoofyBoy",
      username: "moofyboy",
    },
  });
  const content = "Hey @MoofyBoy, how are you?";
  assertEquals(
    await formatOutgoingMentions(
      content,
      channel as unknown as GuildTextBasedChannel,
    ),
    "Hey <@123456789>, how are you?",
  );
});

Deno.test("formatOutgoingMentions - multiple mentions of same user", async () => {
  const channel = createMockChannel({
    "123456789": {
      id: "123456789",
      displayName: "MoofyBoy",
      username: "moofyboy",
    },
  });
  const content = "@MoofyBoy told @MoofyBoy about it";
  assertEquals(
    await formatOutgoingMentions(
      content,
      channel as unknown as GuildTextBasedChannel,
    ),
    "<@123456789> told <@123456789> about it",
  );
});

Deno.test("formatOutgoingMentions - multiple different users", async () => {
  const channel = createMockChannel({
    "123456789": {
      id: "123456789",
      displayName: "MoofyBoy",
      username: "moofyboy",
    },
    "987654321": {
      id: "987654321",
      displayName: "CoolCat",
      username: "coolcat",
    },
  });
  const content = "@MoofyBoy and @CoolCat are friends";
  assertEquals(
    await formatOutgoingMentions(
      content,
      channel as unknown as GuildTextBasedChannel,
    ),
    "<@123456789> and <@987654321> are friends",
  );
});

Deno.test("formatOutgoingMentions - special mention @everyone", async () => {
  const channel = createMockChannel({});
  const content = "Hey @everyone, meeting starts now!";
  assertEquals(
    await formatOutgoingMentions(
      content,
      channel as unknown as GuildTextBasedChannel,
    ),
    "Hey @everyone, meeting starts now!",
  );
});

Deno.test("formatOutgoingMentions - special mention @here", async () => {
  const channel = createMockChannel({});
  const content = "@here please check this out";
  assertEquals(
    await formatOutgoingMentions(
      content,
      channel as unknown as GuildTextBasedChannel,
    ),
    "@here please check this out",
  );
});

Deno.test("formatOutgoingMentions - mixed user and special mentions", async () => {
  const channel = createMockChannel({
    "123456789": {
      id: "123456789",
      displayName: "MoofyBoy",
      username: "moofyboy",
    },
  });
  const content = "@everyone, @MoofyBoy has an announcement";
  assertEquals(
    await formatOutgoingMentions(
      content,
      channel as unknown as GuildTextBasedChannel,
    ),
    "@everyone, <@123456789> has an announcement",
  );
});

Deno.test("formatOutgoingMentions - username match instead of display name", async () => {
  const channel = createMockChannel({
    "123456789": {
      id: "123456789",
      displayName: "Server Nickname",
      username: "moofyboy",
    },
  });
  const content = "Hey @moofyboy, check this out";
  assertEquals(
    await formatOutgoingMentions(
      content,
      channel as unknown as GuildTextBasedChannel,
    ),
    "Hey <@123456789>, check this out",
  );
});

Deno.test("formatOutgoingMentions - unknown user is not converted", async () => {
  const channel = createMockChannel({});
  const content = "Hey @UnknownUser, are you there?";
  assertEquals(
    await formatOutgoingMentions(
      content,
      channel as unknown as GuildTextBasedChannel,
    ),
    "Hey @UnknownUser, are you there?",
  );
});

Deno.test("formatIncomingMentions then formatOutgoingMentions - round trip", async () => {
  const message = createMockMessage({
    "123456789": { displayName: "MoofyBoy", username: "moofyboy" },
  });
  const channel = createMockChannel({
    "123456789": {
      id: "123456789",
      displayName: "MoofyBoy",
      username: "moofyboy",
    },
  });

  const original = "Hey <@123456789>, how are you?";
  const formatted = await formatIncomingMentions(
    original,
    message as unknown as Message<true>,
  );
  assertEquals(formatted, "Hey @MoofyBoy, how are you?");

  const restored = await formatOutgoingMentions(
    formatted,
    channel as unknown as GuildTextBasedChannel,
  );
  assertEquals(restored, "Hey <@123456789>, how are you?");
});
