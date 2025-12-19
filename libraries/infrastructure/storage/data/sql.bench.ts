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

import { sql } from "./sql.ts";

// Test data for benchmarks
const simpleValue = "test";
const numberValue = 42;
const arrayValues = [1, 2, 3, 4, 5];
const nestedSql = sql`SELECT * FROM users WHERE id = ${1}`;
const arrayOfSql = [
  sql`name = ${"Alice"}`,
  sql`age = ${30}`,
  sql`city = ${"NYC"}`,
];

Deno.bench("sql - simple string parameter", () => {
  sql`SELECT * FROM users WHERE name = ${simpleValue}`;
});

Deno.bench("sql - simple number parameter", () => {
  sql`SELECT * FROM users WHERE id = ${numberValue}`;
});

Deno.bench("sql - multiple parameters", () => {
  sql`SELECT * FROM users WHERE name = ${simpleValue} AND age = ${numberValue}`;
});

Deno.bench("sql - array of values (IN clause)", () => {
  sql`SELECT * FROM users WHERE id IN (${arrayValues})`;
});

Deno.bench("sql - nested SqlInstructions", () => {
  sql`SELECT * FROM (${nestedSql}) as subquery`;
});

Deno.bench("sql - array of SqlInstructions", () => {
  sql`UPDATE users SET ${arrayOfSql} WHERE id = ${1}`;
});

Deno.bench("sql - complex query with mixed types", () => {
  sql`
    INSERT INTO logs (user_id, action, metadata, timestamp)
    VALUES (${123}, ${"login"}, ${"null"}, ${Date.now()})
  `;
});

Deno.bench("sql - no parameters", () => {
  sql`SELECT * FROM users`;
});

Deno.bench("sql - undefined parameter", () => {
  sql`SELECT * FROM users WHERE deleted_at = ${undefined}`;
});

Deno.bench("sql - null string parameter", () => {
  sql`SELECT * FROM users WHERE notes = ${"null"}`;
});
