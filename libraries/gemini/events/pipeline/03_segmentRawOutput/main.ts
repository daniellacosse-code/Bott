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

import type { EventPipelineProcessor } from "../types.ts";

export const segmentRawOutput: EventPipelineProcessor = async (context) => {
  return context;
};

//   const commonFields = {
//         id: crypto.randomUUID(),
//         type: event.type,
//         timestamp: new Date(),
//         user: context.user,
//         channel: context.channel,
//         // Gemini does not return the full parent event
//         parent: event.parent ? (await getEvents(event.parent.id))[0] : undefined,
//       };

//       if (event.type === BottEventType.ACTION_CALL) {
//         yield {
//           ...commonFields,
//           type: BottEventType.ACTION_CALL,
//           details: event.details as {
//             name: string;
//             options: O;
//             scores: Record<string, number>;
//           },
//         };
//       } else {
//         yield {
//           ...commonFields,
//           details: event.details as {
//             content: string;
//             scores: Record<string, number>;
//           },
//         };
//       }
// }
