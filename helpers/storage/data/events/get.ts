import { join } from "jsr:@std/path";

import { FS_ASSET_ROOT } from "../../start.ts";

import type {
  AnyBottEvent,
  BottEventType,
  BottInputFile,
  BottInputFileType,
  BottOutputFile,
  BottOutputFileType,
} from "@bott/model";

import { commit } from "../commit.ts";
import { sql } from "../sql.ts";

export const getEvents = async (
  ...ids: string[]
): Promise<AnyBottEvent[]> => {
  const result = commit(
    sql`
      select
        e.id as e_id, e.type as e_type, e.details as e_details, e.timestamp as e_timestamp, -- event
        c.id as c_id, c.name as c_name, c.description as c_description, c.config as c_config, -- channel
        s.id as s_id, s.name as s_name, s.description as s_description, -- space
        u.id as u_id, u.name as u_name, -- user
        p.id as p_id, -- parent event
        i.url as i_url, i.type as i_type, i.path as i_path, -- input file
        o.id as o_id, o.type as o_type, o.path as o_path -- output file
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
        inputs i on e.id = i.parent_id
      left join
        outputs o on e.id = o.parent_id
      where
        e.id in (${ids})
      order by e.timestamp asc`,
  );

  if ("error" in result) {
    throw result.error;
  }

  const events = new Map<string, AnyBottEvent>();

  for (
    const {
      e_id: id,
      e_type: type,
      e_details: details,
      e_timestamp: timestamp,
      ...context
    } of result.reads
  ) {
    // add file to existing event
    if (events.has(id) && context.i_url) {
      const event = events.get(id)!;

      event.files ??= [] as BottInputFile[];
      event.files.push({
        url: new URL(context.i_url),
        path: context.i_path,
        type: context.i_type as BottInputFileType,
        data: Deno.readFileSync(join(FS_ASSET_ROOT, context.i_path)),
      });

      continue;
    }

    if (events.has(id) && context.o_id) {
      const event = events.get(id)!;

      event.files ??= [] as BottOutputFile[];
      event.files.push({
        id: context.o_id,
        path: context.o_path,
        type: context.o_type as BottInputFileType,
        data: Deno.readFileSync(join(FS_ASSET_ROOT, context.o_path)),
      });

      continue;
    }

    const event: AnyBottEvent = {
      id,
      type: type as BottEventType,
      details: JSON.parse(details),
      timestamp: new Date(timestamp),
    };

    if (context.c_id) {
      event.channel = {
        id: context.c_id,
        name: context.c_name,
        description: context.c_description,
        space: {
          id: context.s_id,
          name: context.s_name,
          description: context.s_description,
        },
      };
    }

    if (context.u_id) {
      event.user = {
        id: context.u_id,
        name: context.u_name,
      };
    }

    if (context.p_id) {
      event.parent = (await getEvents(context.p_id))[0];
    }

    if (context.i_url) {
      event.files = [{
        url: new URL(context.i_url),
        path: context.i_path,
        type: context.i_type as BottInputFileType,
        data: Deno.readFileSync(join(FS_ASSET_ROOT, context.i_path)),
      }];
    } else if (context.o_id) {
      event.files = [{
        id: context.o_id,
        path: context.o_path,
        type: context.o_type as BottOutputFileType,
        data: Deno.readFileSync(join(FS_ASSET_ROOT, context.o_path)),
      }];
    }
  }

  return [...events.values()];
};

// TODO: get channel history in a single query
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

  return result.reads.map(({ id }: any) => id);
};
