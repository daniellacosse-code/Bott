export function getCommandBottEvent(
  interaction: ChatInputCommandInteraction,
): BottEvent<{ name: string; prompt: string }> {
  const event: BottEvent<{ name: string; prompt: string }> = {
    id: crypto.randomUUID(),
    type: BottEventType.REQUEST,
    details: {
      name: interaction.commandName,
      prompt: interaction.get("prompt")?.value,
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
