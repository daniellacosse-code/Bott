import type { BottInputFile, BottOutputFile } from "./types.ts";

// TODO: make these more robust
export const isBottInputFile = (obj: unknown): obj is BottInputFile => {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  if (!("url" in obj)) {
    return false;
  }

  return true;
};

export const isBottOutputFile = (obj: unknown): obj is BottOutputFile => {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  if (!("id" in obj)) {
    return false;
  }

  return true;
};
