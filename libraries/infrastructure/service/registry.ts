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

import type { BottService } from "@bott/service";

export class BottServiceRegistry {
  services: Map<string, BottService> = new Map();
  providedEvents: Set<string> = new Set();
  nonce?: string | null;

  register(service: BottService): void {
    if (this.services.has(service.user.id)) {
      throw new Error(`Service "${service.user.id}" is already registered.`);
    }
    this.services.set(service.user.id, service);
    if (service.events) {
      for (const event of service.events) {
        this.providedEvents.add(event);
      }
    }
  }

  get(id: string): BottService | undefined {
    return this.services.get(id);
  }

  isEventProvided(type: string): boolean {
    return this.providedEvents.has(type);
  }
}

export const serviceRegistry: BottServiceRegistry = new BottServiceRegistry();
