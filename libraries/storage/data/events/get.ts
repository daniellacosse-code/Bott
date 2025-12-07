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

import type { BottEvent, BottEventType } from "@bott/model";
import { log } from "@bott/logger";

import { commit } from "../commit.ts";
import { sql } from "../sql.ts";
import { resolveAttachment } from "../../files/resolveAttachment.ts";

export const getEvents = async (
  ...ids: string[]
): Promise<BottEvent[]> => {
  const result = commit(
    sql`
      select
        e.id as e_id, e.type as e_type, e.details as e_details, e.created_at as e_created_at, e.last_processed_at as e_last_processed_at, -- event
        c.id as c_id, c.name as c_name, c.description as c_description, c.config as c_config, -- channel
        s.id as s_id, s.name as s_name, s.description as s_description, -- space
        u.id as u_id, u.name as u_name, -- user
        p.id as p_id, -- parent event
        f.id as f_id, f.is_compressed as f_is_compressed, f.type as f_type, f.source_url as f_source_url -- file
      from
        events e
      left join
        events p on e.parent_id = p.id
      left join
        channels c on e.channel_id = c.id
      left join
        spaces s on c.space_id = s.id
      left join
        users u on e.user_id = u.id
      left join
        files f on e.id = f.parent_id
      where
        e.id in (${ids})
      order by e.created_at asc`,
  );

  if ("error" in result) {
    throw result.error;
  }

  const events = new Map<string, BottEvent>();
  const fileRows = new Map<
    string,
    Map<boolean, { type: string; sourceUrl?: string }>
  >();

  for (
    const {
      e_id: id,
      e_type: type,
      e_details: details,
      e_created_at: createdAt,
      e_last_processed_at: lastProcessedAt,
      ...rowData
    } of result.reads
  ) {
    // Collect file rows first
    if (rowData.f_id) {
      if (!fileRows.has(rowData.f_id)) {
        fileRows.set(rowData.f_id, new Map());
      }
      fileRows.get(rowData.f_id)!.set(rowData.f_is_compressed as boolean, {
        type: rowData.f_type as string,
        sourceUrl: rowData.f_source_url as string | undefined,
      });
    }

    if (events.has(id)) {
      continue;
    }

    const event: BottEvent = {
      id,
      type: type as BottEventType,
      details: JSON.parse(details),
      createdAt: new Date(createdAt),
      lastProcessedAt: lastProcessedAt ? new Date(lastProcessedAt) : undefined,
      attachments: undefined,
    };

    if (rowData.c_id) {
      event.channel = {
        id: rowData.c_id,
        name: rowData.c_name,
        description: rowData.c_description,
        space: {
          id: rowData.s_id,
          name: rowData.s_name,
          description: rowData.s_description,
        },
      };
    }

    if (rowData.u_id) {
      event.user = {
        id: rowData.u_id,
        name: rowData.u_name,
      };
    }

    events.set(id, event);
  }

  // Process attachments and attach to events
  const processedAttachments = new Set<string>();

  for (const { e_id: eventId, f_id: attachmentId } of result.reads) {
    if (!attachmentId || processedAttachments.has(attachmentId)) {
      continue;
    }

    processedAttachments.add(attachmentId);
    const variants = fileRows.get(attachmentId)!;
    const event = events.get(eventId)!;

    // Get source URL from either variant (they should be the same)
    const rawVariant = variants.get(false);
    const compressedVariant = variants.get(true);
    const sourceUrl = rawVariant?.sourceUrl ?? compressedVariant?.sourceUrl;

    try {
      const attachment = await resolveAttachment({
        id: attachmentId,
        source: sourceUrl ? new URL(sourceUrl) : new URL("data:,unknown"),
        parent: event,
      });

      event.attachments ??= [];
      event.attachments.push(attachment);
    } catch (e) {
      log.warn(`Failed to resolve file [${attachmentId}]: ${e}`);
    }
  }

  // Handle parent events
  for (const rowData of result.reads) {
    if (rowData.p_id && events.has(rowData.e_id)) {
      const event = events.get(rowData.e_id)!;
      if (!event.parent) {
        [event.parent] = await getEvents(rowData.p_id);
      }
    }
  }

  return [...events.values()];
};

export const getEventIdsForChannel = (channelId: string): string[] => {
  const result = commit(
    sql`
      select e.id
      from events e
      where e.channel_id = ${channelId}`,
  );

  if ("error" in result) {
    throw result.error;
  }

  // deno-lint-ignore no-explicit-any
  return result.reads.map(({ id }: any) => id);
};
