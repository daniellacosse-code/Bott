export const getPromptSlug = (prompt: string, maxLength: number = 20) =>
  prompt.replaceAll(/\s+/g, "-").slice(0, maxLength);
