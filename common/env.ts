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

import { load, parse, stringify } from "@std/dotenv";

export async function loadEnv(envName: string) {
  await load({
    envPath: `.env.${envName}`,
    export: true,
  });
}

export function readEnv<T>(key: string, defaultValue: T): T {
  const value = Deno.env.get(key);

  if (value === undefined) {
    return defaultValue;
  }

  if (Array.isArray(defaultValue)) {
    return value.split(/,\s*/).map((item) => item.trim()).filter((item) =>
      item.length > 0
    ) as T;
  }

  switch (typeof defaultValue) {
    case "number":
      return Number(value) as T;
    case "boolean":
      return Boolean(value) as T;
    default:
      return value as T;
  }
}

export async function updateEnv(
  envName: string,
  updates: Record<string, string>,
) {
  const path = `.env.${envName}`;
  const data = await parse(await Deno.readTextFile(path));

  for (const [key, value] of Object.entries(updates)) {
    const trimKey = key.trim();
    data[trimKey] = value.trim();
    Deno.env.set(trimKey, data[trimKey] as string);
  }

  await Deno.writeTextFile(path, stringify(data));
}
