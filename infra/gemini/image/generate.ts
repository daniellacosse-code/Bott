import { SafetyFilterLevel } from "npm:@google/genai";
import { decodeBase64 } from "jsr:@std/encoding";

import _gemini from "../client.ts";
import type { PromptParameters } from "../types.ts";

export async function generateImage(prompt: string, {
  model = "imagen-3.0-fast-generate-001",
  gemini = _gemini,
}: PromptParameters = {}): Promise<Uint8Array> {
  const response = await gemini.models.generateImages({
    model,
    prompt,
    config: {
      numberOfImages: 1,
      safetyFilterLevel: SafetyFilterLevel.BLOCK_ONLY_HIGH,
      includeRaiReason: true,
      addWatermark: true,
      enhancePrompt: true,
    },
  });

  if (!response.generatedImages?.length) {
    throw new Error("No images generated");
  }

  const [imageData] = response.generatedImages;

  if (imageData.raiFilteredReason) {
    throw new Error(`Image blocked: ${imageData.raiFilteredReason}`);
  }

  if (!imageData.image) {
    throw new Error("No image data");
  }

  if (!imageData.image.imageBytes) {
    throw new Error("No image bytes");
  }

  return decodeBase64(imageData.image.imageBytes);
}
