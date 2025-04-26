import type { CommandInteraction } from "npm:discord.js";

export enum CommandOptionType {
  STRING = "string",
  INTEGER = "integer",
  BOOLEAN = "boolean",
  USER = "user",
  CHANNEL = "channel",
}

export type CommandOption = {
  name: string;
  type: CommandOptionType;
  description?: string;
  required?: boolean;
};

export type CommandObject = {
  description?: string;
  options?: CommandOption[];
  command: (interaction: CommandInteraction) => void;
};
