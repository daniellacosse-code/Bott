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

import { assertEquals } from "@std/assert";
import { writeWavHeader } from "./song.ts";

Deno.test("writeWavHeader - generates correct header structure", () => {
  const sampleRate = 48000;
  const numChannels = 2;
  const bitsPerSample = 16;
  const dataLength = 1000;

  const header = writeWavHeader(
    sampleRate,
    numChannels,
    bitsPerSample,
    dataLength,
  );

  // Header should be 44 bytes
  assertEquals(header.length, 44);

  // Check magic numbers
  assertEquals(header.toString("ascii", 0, 4), "RIFF");
  assertEquals(header.toString("ascii", 8, 12), "WAVE");
  assertEquals(header.toString("ascii", 12, 16), "fmt ");
  assertEquals(header.toString("ascii", 36, 40), "data");

  // Check calculated values
  const view = new DataView(
    header.buffer,
    header.byteOffset,
    header.byteLength,
  );

  // ChunkSize = 36 + dataLength
  assertEquals(view.getUint32(4, true), 36 + dataLength);

  // Subchunk1Size = 16 (for PCM)
  assertEquals(view.getUint32(16, true), 16);

  // AudioFormat = 1 (PCM)
  assertEquals(view.getUint16(20, true), 1);

  // NumChannels
  assertEquals(view.getUint16(22, true), numChannels);

  // SampleRate
  assertEquals(view.getUint32(24, true), sampleRate);

  // ByteRate = SampleRate * NumChannels * BitsPerSample/8
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  assertEquals(view.getUint32(28, true), byteRate);

  // BlockAlign
  assertEquals(view.getUint16(32, true), blockAlign);

  // BitsPerSample
  assertEquals(view.getUint16(34, true), bitsPerSample);

  // Subchunk2Size = dataLength
  assertEquals(view.getUint32(40, true), dataLength);
});
