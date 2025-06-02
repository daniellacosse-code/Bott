import type { BottOutputFile, BottOutputFileType } from "@bott/model";

// TODO: implement this
export const createOutputFile = (
  data: Uint8Array,
  type: BottOutputFileType,
): Promise<BottOutputFile> => {
  return Promise.resolve({
    id: crypto.randomUUID(),
    data,
    type,
    path: "TODO",
  });
};
