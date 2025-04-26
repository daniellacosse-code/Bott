import { Client, Events } from "npm:discord.js";

const defaultIntents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.GuildMembers,
];

export function create({
  message,
  interaction,
  ready,
  intents = defaultIntents
}): Promise<Client> {
  const client = new Client({ intents });

  client.once(Events.ClientReady, ready.bind(client));
  client.on(Events.MessageCreate, message.bind(client));
  client.on(Events.InteractionCreate, interaction.bind(client));

  await client.login(Deno.env("DISCORD_TOKEN"));

  return client;
}
