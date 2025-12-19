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

import { budgetedStringify } from "./budgetedStringify.ts";

// Test data for benchmarks
const smallString = "Hello, World!";
const largeString = "a".repeat(10000);
const smallObject = { name: "John", age: 30, city: "New York" };
const largeObject = {
  users: Array.from({ length: 100 }, (_, i) => ({
    id: i,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    metadata: {
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      tags: ["tag1", "tag2", "tag3"],
    },
  })),
};
const deeplyNestedObject = (() => {
  let obj: Record<string, unknown> = { value: "leaf" };
  for (let i = 0; i < 50; i++) {
    obj = { nested: obj };
  }
  return obj;
})();

Deno.bench("budgetedStringify - small string within budget", () => {
  budgetedStringify(smallString, 100);
});

Deno.bench("budgetedStringify - large string exceeds budget", () => {
  budgetedStringify(largeString, 100);
});

Deno.bench("budgetedStringify - small object within budget", () => {
  budgetedStringify(smallObject, 100);
});

Deno.bench("budgetedStringify - large object exceeds budget", () => {
  budgetedStringify(largeObject, 500);
});

Deno.bench("budgetedStringify - deeply nested object", () => {
  budgetedStringify(deeplyNestedObject, 1000);
});

Deno.bench("budgetedStringify - array of strings", () => {
  const data = Array.from({ length: 100 }, (_, i) => `string ${i}`);
  budgetedStringify(data, 500);
});

Deno.bench("budgetedStringify - mixed types array", () => {
  const data = [
    "string",
    123,
    true,
    null,
    { key: "value" },
    ["nested", "array"],
  ];
  budgetedStringify(data, 200);
});

Deno.bench("budgetedStringify - very tight budget", () => {
  budgetedStringify(largeObject, 50);
});

Deno.bench("budgetedStringify - generous budget", () => {
  budgetedStringify(smallObject, 10000);
});
