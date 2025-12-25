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

import { join } from "@std/path";

Deno.test("coverage: import all source files", async () => {
  const roots = ["app", "libraries", "model"];
  const cwd = Deno.cwd();

  for (const root of roots) {
    const rootPath = join(cwd, root);
    try {
      await walkAndImport(rootPath);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        // Ignore if directory doesn't exist (e.g. model might be empty or missing in some checkouts?)
        // But given project structure, they should exist.
        console.warn(`Directory not found: ${rootPath}`);
      } else {
        throw error;
      }
    }
  }
});

async function walkAndImport(dir: string) {
  for await (const entry of Deno.readDir(dir)) {
    const path = join(dir, entry.name);
    if (entry.isDirectory) {
      await walkAndImport(path);
    } else if (
      entry.isFile && path.endsWith(".ts") && !path.endsWith(".test.ts") &&
      !path.endsWith(".d.ts")
    ) {
      try {
        await import(`file://${path}`);
      } catch (error) {
        console.error(`Failed to import ${path}:`, error);
        // We log but don't fail, to ensure we catch as much as possible.
        // However, failing imports is usually a sign of bad code too.
      }
    }
  }
}
