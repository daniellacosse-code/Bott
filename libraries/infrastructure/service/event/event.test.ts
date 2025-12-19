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

import { BottActionEventType } from "@bott/actions";
import { STORAGE_DEPLOY_NONCE_LOCATION } from "@bott/constants";
import { BottEventType } from "@bott/model";
import type { BottChannel, BottUser } from "@bott/model";
import { assert, assertEquals, assertExists } from "@std/assert";
import { assertSpyCall, assertSpyCalls, spy, stub } from "@std/testing/mock";
import { serviceRegistry } from "../registry.ts";
import type { BottService } from "../types.ts";
import { addEventListener } from "./listener.ts";
import { BottServiceEvent } from "./main.ts";

Deno.test("BottServiceEvent - constructor initializes required properties", () => {
  const event = new BottServiceEvent(BottEventType.MESSAGE);

  // Verify required properties are initialized
  assertEquals(event.type, BottEventType.MESSAGE);
  assertExists(event.id, "Event should have an id");
  assertExists(event.createdAt, "Event should have a createdAt timestamp");
  assert(event.createdAt instanceof Date, "createdAt should be a Date object");
  assert(event.id.length > 0, "id should not be empty");
});

Deno.test("BottServiceEvent - constructor generates unique IDs", () => {
  const event1 = new BottServiceEvent(BottEventType.MESSAGE);
  const event2 = new BottServiceEvent(BottEventType.MESSAGE);

  assert(event1.id !== event2.id, "Each event should have a unique id");
});

Deno.test("BottServiceEvent - constructor accepts detail in eventInitDict", () => {
  const detail = { content: "Hello, world!" };
  const event = new BottServiceEvent(BottEventType.MESSAGE, { detail });

  assertEquals(event.detail, detail);
  assertEquals(event.detail.content, "Hello, world!");
});

Deno.test("BottServiceEvent - constructor accepts optional channel", () => {
  const channel: BottChannel = {
    id: "channel-123",
    name: "general",
    space: { id: "space-1", name: "Test Space" },
  };
  const event = new BottServiceEvent(BottEventType.MESSAGE, { channel });

  assertEquals(event.channel, channel);
  assertEquals(event.channel?.id, "channel-123");
  assertEquals(event.channel?.name, "general");
});

Deno.test("BottServiceEvent - constructor accepts optional user", () => {
  const user: BottUser = {
    id: "user-456",
    name: "Alice",
  };
  const event = new BottServiceEvent(BottEventType.MESSAGE, { user });

  assertEquals(event.user, user);
  assertEquals(event.user?.id, "user-456");
  assertEquals(event.user?.name, "Alice");
});

Deno.test("BottServiceEvent - constructor accepts optional parent", () => {
  const parentEvent = new BottServiceEvent(BottEventType.MESSAGE, {
    detail: { content: "Original message" },
  });
  const replyEvent = new BottServiceEvent(BottEventType.REPLY, {
    detail: { content: "Reply message" },
    parent: parentEvent,
  });

  assertEquals(replyEvent.parent, parentEvent);
  assertEquals(replyEvent.parent?.type, BottEventType.MESSAGE);
});

Deno.test("BottServiceEvent - constructor accepts optional attachments", () => {
  const parentEvent = new BottServiceEvent(BottEventType.MESSAGE);
  const attachments = [
    {
      id: "attachment-1",
      parent: parentEvent,
      originalSource: new URL("https://example.com/image.png"),
      raw: {
        id: "raw-1",
        path: "/path/to/raw",
        file: new File([], "image.png"),
      },
      compressed: {
        id: "compressed-1",
        path: "/path/to/compressed",
        file: new File([], "image_compressed.png"),
      },
    },
  ];
  const event = new BottServiceEvent(BottEventType.MESSAGE, { attachments });

  assertEquals(event.attachments, attachments);
  assertEquals(event.attachments?.length, 1);
  assertEquals(event.attachments?.[0].id, "attachment-1");
});

Deno.test("BottServiceEvent - constructor without eventInitDict works", () => {
  const event = new BottServiceEvent(BottEventType.MESSAGE);

  assertEquals(event.channel, undefined);
  assertEquals(event.parent, undefined);
  assertEquals(event.user, undefined);
  assertEquals(event.attachments, undefined);
  assertEquals(event.detail, undefined);
});

Deno.test("BottServiceEvent - extends CustomEvent", () => {
  const event = new BottServiceEvent(BottEventType.MESSAGE);

  assert(
    event instanceof CustomEvent,
    "BottServiceEvent should extend CustomEvent",
  );
  assert(event instanceof Event, "BottServiceEvent should be an Event");
});

Deno.test("BottServiceEvent - CustomEvent properties are accessible", () => {
  const detail = { content: "Test message" };
  const event = new BottServiceEvent(BottEventType.MESSAGE, { detail });

  assertEquals(event.type, BottEventType.MESSAGE);
  assertEquals(event.detail, detail);
  assertEquals(event.bubbles, false); // Default CustomEvent behavior
  assertEquals(event.cancelable, false); // Default CustomEvent behavior
});

Deno.test("BottServiceEvent - toJSON includes all properties", () => {
  const channel: BottChannel = {
    id: "channel-123",
    name: "general",
    space: { id: "space-1", name: "Test Space" },
  };
  const user: BottUser = {
    id: "user-456",
    name: "Bob",
  };
  const parentEvent = new BottServiceEvent(BottEventType.MESSAGE);
  const detail = { content: "Test content" };
  const attachments = [
    {
      id: "attachment-1",
      parent: parentEvent,
      originalSource: new URL("https://example.com/file.pdf"),
      raw: {
        id: "raw-1",
        path: "/path/to/raw",
        file: new File([], "file.pdf"),
      },
      compressed: {
        id: "compressed-1",
        path: "/path/to/compressed",
        file: new File([], "file_compressed.pdf"),
      },
    },
  ];

  const event = new BottServiceEvent(BottEventType.REPLY, {
    detail,
    channel,
    user,
    parent: parentEvent,
    attachments,
  });

  const json = event.toJSON();

  assertExists(json.id);
  assertEquals(json.type, BottEventType.REPLY);
  assertEquals(json.detail, detail);
  assertExists(json.createdAt);
  assertEquals(json.channel, channel);
  assertEquals(json.user, user);
  assertEquals(json.parent, parentEvent);
  assertEquals(json.attachments, attachments);
});

Deno.test("BottServiceEvent - toJSON with minimal properties", () => {
  const event = new BottServiceEvent(BottEventType.MESSAGE);
  const json = event.toJSON();

  assertExists(json.id);
  assertEquals(json.type, BottEventType.MESSAGE);
  assertExists(json.createdAt);
  assertEquals(json.lastProcessedAt, undefined);
  assertEquals(json.channel, undefined);
  assertEquals(json.parent, undefined);
  assertEquals(json.user, undefined);
  assertEquals(json.attachments, undefined);
});

Deno.test("BottServiceEvent - toJSON includes lastProcessedAt when set", () => {
  const event = new BottServiceEvent(BottEventType.MESSAGE);
  const processedTime = new Date();
  event.lastProcessedAt = processedTime;

  const json = event.toJSON();

  assertEquals(json.lastProcessedAt, processedTime);
});

Deno.test("BottServiceEvent - toJSON result is serializable", () => {
  const event = new BottServiceEvent(BottEventType.MESSAGE, {
    detail: { content: "Serialization test" },
  });

  const json = event.toJSON();
  const serialized = JSON.stringify(json);

  assert(serialized.length > 0, "JSON should be serializable");
  assert(
    serialized.includes(event.id),
    "Serialized JSON should include event id",
  );
  assert(
    serialized.includes(BottEventType.MESSAGE),
    "Serialized JSON should include event type",
  );
});

Deno.test("BottServiceEvent - supports all event types", () => {
  const messageEvent = new BottServiceEvent(BottEventType.MESSAGE);
  const replyEvent = new BottServiceEvent(BottEventType.REPLY);
  const reactionEvent = new BottServiceEvent(BottEventType.REACTION);
  const actionCallEvent = new BottServiceEvent(BottActionEventType.ACTION_CALL);
  const actionCompleteEvent = new BottServiceEvent(
    BottActionEventType.ACTION_COMPLETE,
  );
  const actionErrorEvent = new BottServiceEvent(
    BottActionEventType.ACTION_ERROR,
  );

  assertEquals(messageEvent.type, BottEventType.MESSAGE);
  assertEquals(replyEvent.type, BottEventType.REPLY);
  assertEquals(reactionEvent.type, BottEventType.REACTION);
  assertEquals(actionCallEvent.type, BottActionEventType.ACTION_CALL);
  assertEquals(actionCompleteEvent.type, BottActionEventType.ACTION_COMPLETE);
  assertEquals(actionErrorEvent.type, BottActionEventType.ACTION_ERROR);
});

Deno.test("BottServiceEvent - type-specific details work correctly", () => {
  const actionCallEvent = new BottServiceEvent(
    BottActionEventType.ACTION_CALL,
    {
      detail: {
        id: "actionCallEventId",
        name: "testAction",
        parameters: { param1: "value1" },
      },
    },
  );

  assertEquals(actionCallEvent.detail.name, "testAction");
  assertEquals(actionCallEvent.detail.parameters.param1, "value1");
});

Deno.test("BottServiceEvent - createdAt is close to current time", () => {
  const beforeCreation = new Date();
  const event = new BottServiceEvent(BottEventType.MESSAGE);
  const afterCreation = new Date();

  assert(
    event.createdAt >= beforeCreation,
    "createdAt should be after or equal to before time",
  );
  assert(
    event.createdAt <= afterCreation,
    "createdAt should be before or equal to after time",
  );
});

Deno.test("addEventListener - calls handler when nonce matches", () => {
  const handler = spy();
  const eventType = BottEventType.MESSAGE;
  const nonce = "test-nonce";

  // Set registry nonce
  serviceRegistry.nonce = nonce;

  // Mock Deno.readTextFileSync to return matching nonce
  using _readTextFileSyncStub = stub(
    Deno,
    "readTextFileSync",
    (path: string | URL) => {
      if (path === STORAGE_DEPLOY_NONCE_LOCATION) return nonce;
      throw new Deno.errors.NotFound();
    },
  );

  // Register listener
  addEventListener(eventType, handler);

  // Dispatch event
  const event = new BottServiceEvent(eventType);
  globalThis.dispatchEvent(event);

  // Verify handler called
  assertSpyCalls(handler, 1);
  assert(handler.calls[0].args[0] instanceof BottServiceEvent);
});

Deno.test("addEventListener - does not call handler when nonce mismatches", () => {
  const handler = spy();
  const eventType = BottEventType.MESSAGE;

  // Set registry nonce
  serviceRegistry.nonce = "registry-nonce";

  // Mock Deno.readTextFileSync to return DIFFERENT nonce
  using _readTextFileSyncStub = stub(
    Deno,
    "readTextFileSync",
    (path: string | URL) => {
      if (path === STORAGE_DEPLOY_NONCE_LOCATION) return "disk-nonce";
      throw new Deno.errors.NotFound();
    },
  );

  // Register listener
  addEventListener(eventType, handler);

  // Dispatch event
  const event = new BottServiceEvent(eventType);
  globalThis.dispatchEvent(event);

  // Verify handler NOT called
  assertSpyCalls(handler, 0);
});

Deno.test("addEventListener - passes service to handler", () => {
  const handler = spy();
  const eventType = BottEventType.MESSAGE;
  const nonce = "test-nonce";
  const serviceId = "bot-user-1";
  const serviceMock = { user: { id: serviceId } } as BottService;

  // Setup registry
  serviceRegistry.nonce = nonce;
  serviceRegistry.services.set(serviceId, serviceMock);

  // Mock Deno.readTextFileSync
  using _readTextFileSyncStub = stub(
    Deno,
    "readTextFileSync",
    () => nonce,
  );

  addEventListener(eventType, handler);

  // Dispatch event with matching user
  const event = new BottServiceEvent(eventType, {
    user: { id: serviceId, name: "Bot" },
  });
  globalThis.dispatchEvent(event);

  // Verify handler called with service
  assertSpyCall(handler, 0, {
    args: [event, serviceMock],
  });
});
