import { createBot } from "@infra/discord";
import { generateText } from "@infra/gemini";
import * as commands from "./commands/main.ts";
import * as instructions from "./instructions/main.ts";
import { Message } from "npm:discord.js";
import { HISTORY_LENGTH } from "./constants.ts";

const formatMessage = (message: Message) =>
  `${message.author.id}: ${message.content.trim()}`;

const standardResponse = async (message: Message<true>) => {
  await message.channel.sendTyping();

  const recentHistory = await message.channel.messages.fetch({
    limit: HISTORY_LENGTH,
  });

  const response = await generateText(formatMessage(message), {
    instructions: instructions.standard.trim(),
    context: recentHistory.map(formatMessage),
  });

  return message.reply(response);
};

createBot({
  commands,
  // directMessage: standardResponse,
  channelMention: standardResponse,
  channelReply: standardResponse,
  async channelMessage(message) {
    // if proactive mode is on, gemini is randomly asked if it would like to respond
    if (Math.random() > Number(Deno.env.get("CONFIG_PROACTIVE_REPLY_CHANCE"))) {
      return;
    }

    const recentHistory = await message.channel.messages.fetch({
      limit: HISTORY_LENGTH,
    });

    const response = await generateText(formatMessage(message), {
      instructions: instructions.proactive.trim(),
      context: recentHistory.map(formatMessage),
    });

    if (response === instructions.proactiveIgnore) {
      // gemini decided to ignore this message
      return;
    }

    return message.reply(response);
  },
});
