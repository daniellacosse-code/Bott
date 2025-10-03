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

import {
  type AnyShape,
  type BottAction,
  BottActionOptionType,
  type BottChannel,
  type BottEventClassifier,
  BottEventRuleType,
  BottEventType,
  type BottGlobalSettings,
  type BottUser,
} from "@bott/model";

import {
  type Schema as GeminiStructuredResponseSchema,
  Type as GeminiStructuredResponseType,
} from "npm:@google/genai";
import { reduceClassifiersForRuleType } from "../../utilities/reduce.ts";

export const getResponseSchema = <O extends AnyShape>(
  context: {
    user: BottUser;
    channel: BottChannel;
    actions: Record<string, BottAction<O, AnyShape>>;
    settings: BottGlobalSettings;
  },
): GeminiStructuredResponseSchema => ({
  type: GeminiStructuredResponseType.ARRAY,
  description:
    "The final array of events you have generated and approved for response to the input.",
  items: {
    anyOf: [
      {
        type: GeminiStructuredResponseType.OBJECT,
        description: "Schema for a message, reply, or reaction event.",
        properties: {
          type: {
            type: GeminiStructuredResponseType.STRING,
            enum: [
              BottEventType.MESSAGE,
              BottEventType.REPLY,
              BottEventType.REACTION,
            ],
            description: "The type of event to generate.",
          },
          details: {
            type: GeminiStructuredResponseType.OBJECT,
            description: "The specific details for the generated event.",
            properties: {
              content: { type: GeminiStructuredResponseType.STRING },
              scores: getEventClassifierSchema(
                reduceClassifiersForRuleType(
                  context.settings,
                  BottEventRuleType.FILTER_OUTPUT,
                ),
              ),
            },
            required: ["content", "scores"],
          },
          parent: {
            type: GeminiStructuredResponseType.OBJECT,
            description:
              "A reference to the parent event this output is replying or reacting to. Required for `reply` and `reaction` event types.",
            properties: {
              id: {
                type: GeminiStructuredResponseType.STRING,
                description: "The unique ID of the parent event.",
              },
            },
            required: ["id"],
          },
        },
        required: ["type", "details"],
      },
      ...getActionSchema(context.actions, context.settings),
    ],
  },
});

export const getEventClassifierSchema = (
  classifiers: Record<string, BottEventClassifier>,
): GeminiStructuredResponseSchema => {
  if (Object.keys(classifiers).length === 0) {
    return {};
  }

  return {
    type: GeminiStructuredResponseType.OBJECT,
    description:
      "A collection of scores for various traits, evaluating a message or response.",
    properties: Object.values(classifiers).reduce(
      (properties, { name, definition, examples }) => {
        let description = definition
          ? definition
          : `How much this message pertains to "${name}".`;

        description += `\n\nExample Scores:\n${
          Object.entries(examples).flatMap(
            ([value, examples]) =>
              examples.map((example) => `${example} => Score: ${value}`),
          )
        }`;

        return {
          ...properties,
          [name]: {
            type: GeminiStructuredResponseType.OBJECT,
            description,
            properties: {
              score: {
                type: GeminiStructuredResponseType.STRING,
                description: "The numeric score from 1 to 5.",
                enum: ["1", "2", "3", "4", "5"],
              },
              rationale: {
                type: GeminiStructuredResponseType.STRING,
                description:
                  "A brief, one-sentence justification for the assigned score.",
              },
            },
            required: ["score"],
          },
        };
      },
      {} as Record<string, GeminiStructuredResponseSchema>,
    ),
    required: Object.keys(classifiers),
  };
};

export const getActionSchema = <O extends AnyShape>(
  handlers: Record<string, BottAction<O, AnyShape>>,
  settings: BottGlobalSettings,
): GeminiStructuredResponseSchema[] => {
  if (Object.keys(handlers).length === 0) {
    return [];
  }

  const schemas = [];
  const outputClassifiers = reduceClassifiersForRuleType(
    settings,
    BottEventRuleType.FILTER_OUTPUT,
  );

  for (const name in handlers) {
    const handler = handlers[name];
    // Some handlers might not have options.

    schemas.push({
      type: GeminiStructuredResponseType.OBJECT,
      description: `Schema for the '${name}' action call event.`,
      properties: {
        type: {
          type: GeminiStructuredResponseType.STRING,
          enum: [BottEventType.ACTION_CALL],
        },
        details: {
          type: GeminiStructuredResponseType.OBJECT,
          properties: {
            name: {
              type: GeminiStructuredResponseType.STRING,
              enum: [name],
            },
            options: {
              type: GeminiStructuredResponseType.OBJECT,
              properties: (handler.options ?? []).reduce(
                (properties, option) => {
                  let type: GeminiStructuredResponseType;

                  switch (option.type) {
                    case BottActionOptionType.INTEGER:
                      type = GeminiStructuredResponseType.NUMBER;
                      break;
                    case BottActionOptionType.BOOLEAN:
                      type = GeminiStructuredResponseType.BOOLEAN;
                      break;
                    case BottActionOptionType.STRING:
                    default:
                      type = GeminiStructuredResponseType.STRING;
                      break;
                  }

                  properties[option.name] = {
                    type,
                    enum: option.allowedValues,
                    description: option.description,
                  };

                  return properties;
                },
                {} as Record<string, GeminiStructuredResponseSchema>,
              ),
              required: (handler.options ?? []).filter((option) =>
                option.required
              ).map((option) => option.name),
            },
            scores: getEventClassifierSchema(outputClassifiers),
          },
          required: ["name", "scores"],
        },
      },
      required: ["type", "details"],
    });
  }

  return schemas;
};
