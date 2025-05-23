import type { BottEvent } from "@bott/data";
import { BottEventType } from "@bott/data";
import type { ChatInputCommandInteraction } from "npm:discord.js";

export function getCommandBottEvent(
  interaction: ChatInputCommandInteraction,
): BottEvent<{ name: string; prompt: string }> {
  const event: BottEvent<{ name: string; prompt: string }> = {
    id: crypto.randomUUID(),
    type: BottEventType.REQUEST,
    details: {
      name: interaction.commandName,
      prompt: interaction.command?.options.get("prompt")?.value as string,
    },
    user: {
      id: interaction.user.id,
      name: interaction.user.username,
    },
    channel: {
      id: interaction.channel!.id,
      name: interaction.channel!.name,
      space: {
        id: interaction.guild!.id,
        name: interaction.guild!.name,
      },
    },
    timestamp: new Date(),
  };

  return event;
}
