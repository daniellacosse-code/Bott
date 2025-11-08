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

import { faker } from "@faker-js/faker";
import {
  type AnyShape,
  type BottChannel,
  type BottEvent,
  type BottEventClassifier,
  type BottEventRule,
  BottEventRuleType,
  BottEventType,
  type BottUser,
} from "@bott/model";

import type { EventPipelineContext, EventPipelineProcessor } from "./types.ts";

// Import the processor to test
import { finalizeOutput } from "./04_finalizeOutput/main.ts";

const processorToTest: EventPipelineProcessor = finalizeOutput;

const result = await processorToTest(createMockContext());

console.log(JSON.stringify(result.data.output, null, 2));

// ---

function createMockUser(name?: string): BottUser {
  return {
    id: faker.string.uuid(),
    name: name ?? faker.internet.username(),
  };
}

function createMockChannel(): BottChannel {
  return {
    id: faker.string.uuid(),
    name: `#${faker.lorem.word()}`,
    space: {
      id: faker.string.uuid(),
      name: faker.lorem.word(),
    },
  };
}

function createMockEvent(
  user: BottUser,
  channel: BottChannel,
  type: BottEventType,
  details?: AnyShape,
  parent?: BottEvent,
): BottEvent<AnyShape> {
  return {
    id: faker.string.uuid(),
    type,
    timestamp: faker.date.recent(),
    user,
    channel,
    details: details ?? { content: faker.lorem.sentence() },
    parent,
  };
}

export function createMockContext(): EventPipelineContext {
  const user1 = createMockUser("user1");
  const user2 = createMockUser("user2");
  const bott = createMockUser("bott");
  const channel = createMockChannel();

  const inputEvent1 = createMockEvent(
    user1,
    channel,
    BottEventType.MESSAGE,
    { content: "Hello world!" },
  );
  const inputEvent2 = createMockEvent(
    user2,
    channel,
    BottEventType.REPLY,
    { content: "Hello to you too!" },
    inputEvent1,
  );
  const inputEvent3 = createMockEvent(
    user1,
    channel,
    BottEventType.MESSAGE,
    { content: "What is the capital of France?" },
  );
  const inputEvent4 = createMockEvent(
    user2,
    channel,
    BottEventType.REPLY,
    { content: "Paris, of course." },
    inputEvent3,
  );
  const inputEvent5 = createMockEvent(
    user1,
    channel,
    BottEventType.MESSAGE,
    { content: "And what about Germany?", focus: true },
  );

  const outputEvent1 = createMockEvent(
    bott,
    channel,
    BottEventType.REPLY,
    { content: "I can answer that for you." },
    inputEvent5,
  );
  const outputEvent2 = createMockEvent(
    bott,
    channel,
    BottEventType.REPLY,
    { content: "The capital of Germany is Berlin." },
    outputEvent1,
  );

  const classifier: BottEventClassifier = {
    name: "isInteresting",
    definition: "Is the content interesting?",
    examples: { 1: ["boring", "blah"], 5: ["fascinating", "whohoo"] },
  };

  const classifier2: BottEventClassifier = {
    name: "isCorrect",
    definition: "Is the content correct?",
    examples: { 1: ["<a blatant lie>"], 5: ["<a profound truth>"] },
  };

  const focusRule: BottEventRule = {
    name: "onlyLookAtInterestingThings",
    type: BottEventRuleType.FOCUS_INPUT,
    definition: "Only look at events that are interesting.",
    validator: (event) => {
      return (event.details.scores as any).isInteresting === 5;
    },
    requiredClassifiers: [classifier.name],
  };

  const filterRule: BottEventRule = {
    name: "onlySayCorrectThings",
    type: BottEventRuleType.FILTER_OUTPUT,
    definition: "Only say things that are correct.",
    validator: (event) => {
      return (event.details.scores as any).isCorrect >= 4;
    },
    requiredClassifiers: [classifier2.name],
  };

  return {
    data: {
      input: [
        inputEvent1,
        inputEvent2,
        inputEvent3,
        inputEvent4,
        inputEvent5,
      ],
      output: [
        outputEvent1,
        outputEvent2,
      ],
    },
    abortSignal: new AbortController().signal,
    user: bott,
    channel,
    actions: {},
    settings: {
      identity: "I am a test bot.",
      classifiers: {
        [classifier.name]: classifier,
        [classifier2.name]: classifier2,
      },
      rules: {
        [focusRule.name]: focusRule,
        [filterRule.name]: filterRule,
      },
    },
  };
}
