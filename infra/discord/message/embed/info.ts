import { EmbedBuilder } from "npm:discord.js";
import { EmbedColor } from "./colors.ts";

type InfoEmbedOptions = {
  description?: string;
  fields?: {
    name: string;
    value: string;
  }[];
};

export const createInfoEmbed = (title: string, {
  description,
  fields,
}: InfoEmbedOptions) => {
  const embed = new EmbedBuilder().setColor(EmbedColor.BLUE).setTitle(title);

  if (description) {
    embed.setDescription(description);
  }

  if (fields) {
    embed.addFields(...fields);
  }

  return embed;
};
