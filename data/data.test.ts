import { assertExists } from "jsr:@std/assert";
import { exec, sql } from "./client.ts";

Deno.test("database smoke test", async () => {
  const tempDbFile = await Deno.makeTempFile();

  Deno.env.set("DB_PATH", tempDbFile);

  // spaces
  const { addSpaces } = await import("./model/spaces.ts");

  const chatWorld = {
    id: 1,
    name: "Chat World"
  };

  addSpaces(chatWorld);

  console.log("spaces table:", exec(sql`select * from spaces`));

  // channels
  const { addChannels } = await import("./model/channels.ts");
  
  const channelMain = { id: 1, name: "main", space: chatWorld };
  const channelRandom = {
    id: 2,
    space: chatWorld,
    name: "random",
    description: "random channel",
  };

  addChannels(channelMain, channelRandom);

  console.log("channel table:", exec(sql`select * from channels`));

  // users
  const { addUsers } = await import("./model/users.ts");

  const userNancy = { id: 1, name: "Nancy" };
  const userBob = { id: 2, name: "Bob" };

  addUsers(userNancy, userBob);

  console.log("user table:", exec(sql`select * from users`));

  // events
  const { addEvents, getEvents, EventType } = await import("./model/events.ts");

  const nancyGreeting = {
    id: 1,
    type: EventType.MESSAGE,
    user: userNancy,
    channel: channelMain,
    details: { content: "Hello" },
    timestamp: new Date(),
  };
  const bobReply = {
    id: 2,
    type: EventType.REPLY,
    user: userBob,
    channel: channelMain,
    parent: nancyGreeting,
    details: { content: "Hi" },
    timestamp: new Date(),
  };
  const nancyReaction = {
    id: 3,
    type: EventType.REACTION,
    user: userNancy,
    channel: channelMain,
    parent: bobReply,
    details: { content: "👍" },
    timestamp: new Date(),
  };

  addEvents(nancyGreeting, bobReply, nancyReaction);

  console.log("event table:", exec(sql`select * from events`));

  // test
  const [dbResult] = getEvents(nancyReaction.id);

  console.log("final result:", dbResult);

  assertExists(dbResult.id);
  assertExists(dbResult.type);
  assertExists(dbResult.details);
  assertExists(dbResult.timestamp);
  assertExists(dbResult.channel);
  assertExists(dbResult.channel.id);
  assertExists(dbResult.channel.name);
  assertExists(dbResult.channel.space);
  assertExists(dbResult.channel.space.id);
  assertExists(dbResult.channel.space.name);
  assertExists(dbResult.user);
  assertExists(dbResult.user.id);
  assertExists(dbResult.user.name);
  assertExists(dbResult.parent);
  assertExists(dbResult.parent.id);
  assertExists(dbResult.parent.type);
  assertExists(dbResult.parent.details);
  assertExists(dbResult.parent.timestamp);
});
