// GENERATED
import { assertEquals, assertRejects } from "https://deno.land/std/assert/mod.ts";
import { text } from "./text.ts";
// Assuming GeminiClient type is exported from here, adjust if needed
import type { GeminiClient } from "../main/client.ts";
import type { GenerateContentRequest } from "../main/types.ts"; // Import necessary types

// --- Mock Gemini Client ---
// This function creates a mock client that simulates responses
const createMockGeminiClient = (
  expectedResponseText: string | null,
  // Optional callback to inspect the request sent to the mock
  onRequest?: (request: GenerateContentRequest) => void
): GeminiClient => ({
  models: {
    generateContent: async (request: GenerateContentRequest) => {
      // Call the inspection callback if provided
      onRequest?.(request);

      // Simulate the API response structure
      if (expectedResponseText === null) {
        // Simulate a response with no text content
        return { text: undefined };
      }
      return { text: expectedResponseText };
    },
  },
  // Add any other properties/methods expected by GeminiClient, potentially as undefined or simple mocks
} as unknown as GeminiClient); // Using 'as unknown as GeminiClient' for simplicity in mocking

// --- Test Suites ---

Deno.test("text function returns text on successful API call", async () => {
  const prompt = "What is Deno?";
  const expected = "Deno is a runtime for JavaScript and TypeScript.";
  const mockClient = createMockGeminiClient(expected);

  const result = await text(prompt, { gemini: mockClient });

  assertEquals(result, expected);
});

Deno.test("text function sends correct parameters (context, instructions, model)", async () => {
  const prompt = "Translate 'hello'";
  const context = ["Target language is Spanish"];
  const instructions = "Be formal";
  const model = "gemini-1.5-pro-latest"; // Use a non-default model for testing
  const expected = "Hola";
  let capturedRequest: GenerateContentRequest | undefined;

  const mockClient = createMockGeminiClient(expected, (request) => {
    capturedRequest = request; // Capture the request payload
  });

  await text(prompt, {
    context,
    instructions,
    model,
    gemini: mockClient,
  });

  // Assert that the request sent to the mock client is correctly formatted
  assertEquals(capturedRequest?.model, model);
  assertEquals(capturedRequest?.contents?.length, 2); // 1 context + 1 prompt
  assertEquals(capturedRequest?.contents?.[0]?.role, "user");
  assertEquals(capturedRequest?.contents?.[0]?.parts?.[0]?.text, context[0]);
  assertEquals(capturedRequest?.contents?.[1]?.role, "user");
  assertEquals(capturedRequest?.contents?.[1]?.parts?.[0]?.text, prompt);
  assertEquals(capturedRequest?.config?.systemInstruction?.role, "system");
  assertEquals(capturedRequest?.config?.systemInstruction?.text, instructions);
  assertEquals(capturedRequest?.config?.candidateCount, 1);
});


Deno.test("text function uses default model if not specified", async () => {
  const prompt = "Default model test";
  const expected = "Default response";
  let capturedRequest: GenerateContentRequest | undefined;

  const mockClient = createMockGeminiClient(expected, (request) => {
    capturedRequest = request;
  });

  await text(prompt, { gemini: mockClient }); // No model specified

  // Check if the default model was used in the request
  assertEquals(capturedRequest?.model, "gemini-2.5-flash-preview-04-17");
});


Deno.test("text function throws error when API response has no text", async () => {
  const prompt = "This should fail";
  // Simulate a response where 'text' is null or undefined
  const mockClient = createMockGeminiClient(null);

  await assertRejects(
    () => text(prompt, { gemini: mockClient }),
    Error,
    "No text in response" // Check if the specific error message is thrown
  );
});
