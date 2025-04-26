import {
  Client,
  Events,
  GatewayIntentBits,
  type Message,
  REST,
  Routes,
  SlashCommandBuilder,
} from "npm:discord.js";
import { classifyMessage, MessageClass } from "../message/classify.ts";
import { createErrorEmbed } from "../message/embed/error.ts";
import { type CommandObject, CommandOptionType } from "./types.ts";

const defaultIntents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.GuildMembers,
];

type BotOptions = {
  commands?: Record<string, CommandObject>;
  channelMessage?: (message: Message<true>) => void;
  channelReply?: (message: Message<true>) => void;
  channelMention?: (message: Message<true>) => void;
  intents?: GatewayIntentBits[];
};

// TODO(#1): rate limiting by channel
export async function createBot({
  commands,
  channelMessage,
  channelReply,
  channelMention,
  intents = defaultIntents,
}: BotOptions): Promise<Client> {
  const token = Deno.env.get("DISCORD_TOKEN");

  if (!token) {
    throw new Error("DISCORD_TOKEN is not set");
  }

  const client = new Client({ intents });

  await client.login(token);

  if (!client.user) {
    throw new Error("Client user is not set");
  }

  const botHandle = client.user.id;

  // delegate messages
  client.on(Events.MessageCreate, async (message) => {
    try {
      const messageClass = await classifyMessage(message, botHandle);

      if (messageClass === MessageClass.MENTION) {
        return channelMention?.(message as Message<true>);
      }

      if (messageClass === MessageClass.REPLY) {
        return channelReply?.(message as Message<true>);
      }

      if (messageClass === MessageClass.USER) {
        return channelMessage?.(message as Message<true>);
      }
    } catch (error) {
      await message.reply({ embeds: [createErrorEmbed(error as Error)] });
    }
  });

  if (!commands) {
    return client;
  }

  // delegate commands
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    try {
      await commands[interaction.commandName]?.command(interaction);
    } catch (error) {
      await interaction.reply({ embeds: [createErrorEmbed(error as Error)] });
    }
  });

  // sync commands with discord origin
  const body = [];
  for (const [commandName, commandObject] of Object.entries(commands)) {
    body.push(getCommandJson(commandName, commandObject));
  }

  await new REST({ version: "10" }).setToken(token).put(
    Routes.applicationCommands(botHandle),
    { body },
  );

  return client;
}

function getCommandJson(name: string, {
  description,
  options,
}: CommandObject) {
  const builder = new SlashCommandBuilder().setName(name);

  if (description) {
    builder.setDescription(description);
  }

  if (options && options.length) {
    for (const { name, description, type, required } of options) {
      const buildOption = (option: any) => {
        if (name) {
          option.setName(name);
        }

        if (description) {
          option.setDescription(description);
        }

        if (required) {
          option.setRequired(required);
        }

        return option;
      };

      switch (type) {
        case CommandOptionType.STRING:
          builder.addStringOption(buildOption);
          break;
        case CommandOptionType.INTEGER:
          builder.addIntegerOption(buildOption);
          break;
        case CommandOptionType.BOOLEAN:
          builder.addBooleanOption(buildOption);
          break;
      }
    }
  }

  return builder.toJSON();
}
