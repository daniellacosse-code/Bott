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

import { log, STORAGE_DEPLOY_NONCE_LOCATION, STORAGE_ROOT } from "@bott/common";
import type { BottSettings, BottUser } from "@bott/model";

import { actionService } from "./actions/service.ts";
import { eventStorageService } from "./events/storage/service.ts";
import type {
  BottAction,
  BottEventInterface as BottEvent,
  BottEventType,
  BottService,
  BottServiceContext,
} from "./types.ts";

const deploymentNonce = crypto.randomUUID();
Deno.mkdirSync(STORAGE_ROOT, { recursive: true });
Deno.writeTextFileSync(STORAGE_DEPLOY_NONCE_LOCATION, deploymentNonce);

export class BottSystemManager implements BottSystemManager {
  readonly nonce: string;
  readonly settings: BottSettings;
  private _services: Map<string, BottService> = new Map();
  private _actions: Map<string, BottAction> = new Map();

  constructor({
    settings,
    services = [eventStorageService, actionService],
    actions,
  }: {
    settings: BottSettings;
    services?: BottService[];
    actions?: BottAction[];
  }) {
    this.nonce = deploymentNonce;
    this.settings = settings;

    services.forEach((service) => {
      this._services.set(service.name, service);
    });

    actions?.forEach((action) => {
      this._actions.set(action.name, action);
    });
  }

  get services(): Record<string, BottService> {
    return Object.fromEntries(this._services);
  }

  get actions(): Record<string, BottAction> {
    return Object.fromEntries(this._actions);
  }

  get rootServiceContext(): Omit<BottServiceContext, "settings"> {
    return {
      system: this,
      dispatchEvent: this.dispatchEvent.bind(this),
      addEventListener: this.addEventListener.bind(this),
      removeEventListener: this.removeEventListener.bind(this),
    };
  }

  registerService(service: BottService) {
    if (this._services.has(service.name)) {
      throw new Error(`Service "${service.name}" already registered`);
    }

    this._services.set(service.name, service);
  }

  registerAction(action: BottAction) {
    if (this._actions.has(action.name)) {
      throw new Error(`Action "${action.name}" already registered`);
    }
    this._actions.set(action.name, action);
  }

  start(serviceName: string) {
    const service = this._services.get(serviceName);
    if (!service) {
      throw new Error(`Service "${serviceName}" not found`);
    }

    const context: BottServiceContext = {
      ...this.rootServiceContext,
      settings: {
        name: serviceName,
        user: service.user ??
          { id: `service:${serviceName}`, name: serviceName },
      },
    };

    service.call(context);

    log.info(`Service "${serviceName}" started`);
  }

  isSystemUser(user: BottUser): boolean {
    let result = false;

    for (const service of this._services.values()) {
      if (service.user?.id === user.id) {
        result = true;
        break;
      }
    }

    return result;
  }

  private listeners = new Map<
    (
      // deno-lint-ignore no-explicit-any
      event: any,
      context?: BottServiceContext,
    ) => unknown | Promise<unknown>,
    EventListener
  >();

  addEventListener<E extends BottEvent>(
    eventType: BottEventType,
    handler: (
      event: E,
      context?: BottServiceContext,
    ) => unknown | Promise<unknown>,
  ): void {
    const listener = async (event: Event) => {
      const bottEvent = event as E;

      if (this.nonce !== this.getCurrentDeployNonce()) return;

      try {
        await handler(bottEvent, undefined);
      } catch (error) {
        log.error("Failed to handle event:", event, error);
      }
    };

    // deno-lint-ignore no-explicit-any
    this.listeners.set(handler as any, listener);
    globalThis.addEventListener(eventType, listener);
  }

  removeEventListener<E extends BottEvent>(
    eventType: BottEventType,
    handler: (
      event: E,
      context?: BottServiceContext,
    ) => unknown | Promise<unknown>,
  ): void {
    // deno-lint-ignore no-explicit-any
    if (!this.listeners.has(handler as any)) return;

    globalThis.removeEventListener(
      eventType,
      // deno-lint-ignore no-explicit-any
      this.listeners.get(handler as any)!,
    );
    // deno-lint-ignore no-explicit-any
    this.listeners.delete(handler as any);
  }

  dispatchEvent(event: BottEvent) {
    globalThis.dispatchEvent(event);
  }

  private getCurrentDeployNonce(): string | null {
    try {
      return Deno.readTextFileSync(STORAGE_DEPLOY_NONCE_LOCATION);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return null;
      }

      throw error;
    }
  }
}
