import { type CommandObject, CommandOptionType, createInfoEmbed } from "@infra/discord";

export const help: CommandObject = {
  description: "List the Gemini bot commands",
  command(interaction) {
    return interaction.reply({
      embeds: [createInfoEmbed({
        /* TODO */
      })],
    });
  },
};

// export const config: CommandObject = {
//   description: "Tweak Gemini AI behavior in the current channel",
//   options: [{
//     name: "config",
//     type: CommandOptionType.STRING,
//     description: "The configuration you'd like to change.",
//     required: true
//   }, {
//     name: "value",
//     type: CommandOptionType.STRING,
//     description: "The value you'd like to set.",
//     required: true
//   }],
//   command(interaction) {
//     // TODO
//   }
// };

export const generate: CommandObject = {
  description: "",
  options: [{
    name: "prompt",
    type: CommandOptionType.STRING,
    description: "The description of what you want to generate.",
    required: true
  }, {
    name: "type",
    type: CommandOptionType.BOOLEAN,
    description: "The type of thing you want to generate: text, image, or video (defaults to text)"
  }],
  command(interaction) {
    // TODO
  }
}