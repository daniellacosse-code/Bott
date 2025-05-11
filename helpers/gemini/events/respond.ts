import type { Content } from "npm:@google/genai";

import gemini from "../client.ts";
import type { BottEvent } from "@bott/data";

import baseInstructions from "./baseInstructions.ts";

type GeminiResponseContext = {
  abortSignal: AbortSignal;
  identity: string;
  model?: string;
};

export const respondEvents = async (
  inputEvents: BottEvent[],
  { model = "gemini-2.5-pro-preview-05-06", abortSignal, identity }:
    GeminiResponseContext,
): Promise<BottEvent[]> => {
  const contents: Content[] = inputEvents.map(bottEventToContent);

  const response = await gemini.models.generateContent({
    model,
    contents,
    config: {
      abortSignal,
      candidateCount: 1,
      systemInstruction: identity + baseInstructions,
      tools: [{ googleSearch: {} }],
    },
  });

  // Only one candidate specified.
  const content = response.candidates![0].content;

  if (!content) {
    return [];
  }

  try {
    return contentToBottEvents(content);
  } catch (error) {
    console.error("[ERROR] Problem processing Gemini content:", error);

    return [];
  }
};

export function bottEventToContent(event: BottEvent): Content {
  // TODO
  return {};
}

export function contentToBottEvents(content: Content): BottEvent[] {
  // TODO
  return [];
}

export function splitMessagePreservingCodeBlocks(message: string): string[] {
  const codeBlockRegex = /```[\s\S]*?```/g;
  const placeholders: string[] = [];
  let placeholderIndex = 0;
  const placeholderPrefix = "__CODEBLOCK_PLACEHOLDER_";

  // 1. Replace code blocks with unique placeholders
  const placeholderString = message.replace(codeBlockRegex, (match) => {
    const placeholder = `${placeholderPrefix}${placeholderIndex}__`;
    placeholders[placeholderIndex] = match; // Store the original code block
    placeholderIndex++;
    return placeholder;
  });

  // 2. Split the string containing placeholders by \n\n+
  const initialParts = placeholderString.split(/\n\n+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  // 3. Restore code blocks into the parts
  const finalParts = initialParts.map((part) => {
    let restoredPart = part;
    // Iterate placeholders in reverse to handle potential nesting (though unlikely here)
    for (let i = placeholders.length - 1; i >= 0; i--) {
      restoredPart = restoredPart.replace(
        `${placeholderPrefix}${i}__`,
        placeholders[i],
      );
    }
    return restoredPart;
  });

  return finalParts;
}
