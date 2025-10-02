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

import { assertEquals } from "jsr:@std/assert/equals";
import type { BottUser } from "@bott/model";
import { formatIncomingContent } from "./format.ts";

Deno.test("formatIncomingContent - empty string", () => {
  assertEquals(formatIncomingContent("", []), "");
});

Deno.test("formatIncomingContent - no mentions", () => {
  const content = "Hello, this is a test message.";
  assertEquals(formatIncomingContent(content, []), content);
});

Deno.test("formatIncomingContent - single user mention", () => {
  const users: BottUser[] = [{
    id: "123456789",
    name: "MoofyBoy",
  }];
  const content = "Hey <@123456789>, how are you?";
  assertEquals(
    formatIncomingContent(content, users),
    "Hey @MoofyBoy, how are you?",
  );
});

Deno.test("formatIncomingContent - nickname format", () => {
  const users: BottUser[] = [{
    id: "123456789",
    name: "MoofyBoy",
  }];
  const content = "Hey <@!123456789>, how are you?";
  assertEquals(
    formatIncomingContent(content, users),
    "Hey @MoofyBoy, how are you?",
  );
});

Deno.test("formatIncomingContent - multiple mentions of same user", () => {
  const users: BottUser[] = [{
    id: "123456789",
    name: "MoofyBoy",
  }];
  const content = "<@123456789> told <@123456789> about it";
  assertEquals(
    formatIncomingContent(content, users),
    "@MoofyBoy told @MoofyBoy about it",
  );
});

Deno.test("formatIncomingContent - multiple different users", () => {
  const users: BottUser[] = [
    { id: "123456789", name: "MoofyBoy" },
    { id: "987654321", name: "CoolCat" },
  ];
  const content = "<@123456789> and <@987654321> are friends";
  assertEquals(
    formatIncomingContent(content, users),
    "@MoofyBoy and @CoolCat are friends",
  );
});

Deno.test("formatIncomingContent - special mention @everyone", () => {
  const content = "Hey @everyone, meeting starts now!";
  assertEquals(
    formatIncomingContent(content, []),
    "Hey @everyone, meeting starts now!",
  );
});

Deno.test("formatIncomingContent - unknown user keeps original format", () => {
  const content = "Hey <@999999999>, are you there?";
  assertEquals(
    formatIncomingContent(content, []),
    "Hey <@999999999>, are you there?",
  );
});
