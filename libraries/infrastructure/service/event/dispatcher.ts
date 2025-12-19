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

import { type BottServiceEvent, serviceRegistry } from "@bott/service";

export function dispatchEvent(event: BottServiceEvent): void {
  const type = event.type;

  if (!serviceRegistry.isEventProvided(type)) {
    throw new Error(
      `Event type "${type}" is not provided by any registered service.`,
    );
  }

  globalThis.dispatchEvent(event);
}
