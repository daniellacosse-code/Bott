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

/**
 * Defines the structure for a "Entity" in Bott.
 * An Entity is a generic object with an ID and a name.
 */
export interface BottEntity {
  id: string;
  name: string;
}

/**
 * Defines the structure for a "Space" in Bott.
 * A Space is a top-level container, similar to a server or guild in Discord.
 */
export interface BottSpace extends BottEntity {
  description?: string;
  channels?: BottChannel[];
}

/**
 * Defines the structure for a "Channel" in Bott.
 * A Channel is a specific communication context within a Space, like a text channel.
 */
export interface BottChannel extends BottEntity {
  description?: string;
  space: BottSpace;
}

/**
 * Defines the structure for a "User" in Bott.
 * Represents an individual interacting with the bot.
 */
export interface BottUser extends BottEntity {}
