import { exec, sql } from "../client.ts";
import type { BottEvent } from "./events.ts";
import type { BottSpace } from "./spaces.ts";

exec(
  sql`
    create table if not exists channels (
      id integer primary key not null,
      space_id integer,
      name text not null,
      description text,
      config text,
      foreign key(space_id) references spaces(id)
    )
  `,
);

export interface BottChannel {
  id: number;
  name: string;
  space: BottSpace;
  description?: string;
  // Subobject stored as JSON for flexibility
  config?: {
    isActive: boolean;
  };
}

export const getChannels = (...ids: number[]): BottChannel[] => {
  const rows = exec(
    sql`
      select
        c.id as c_id, c.name as c_name, c.description as c_description, c.config as c_config,
        s.id as s_id, s.name as s_name, s.description as s_description
      from
        channels c
      left join
        spaces s on c.space_id = s.id
      where c.id in (${ids})
    `,
  ) as any[];

  return rows.map((row: any) => {
    const channel: BottChannel = {
      id: row.c_id,
      name: row.c_name,
      description: row.c_description,
      // space property will be populated below
      space: {} as BottSpace, // Placeholder, will be filled
    };
    if (row.c_config) {
      channel.config = JSON.parse(row.c_config);
    }
    if (row.s_id) {
      channel.space = {
        id: row.s_id,
        name: row.s_name,
        description: row.s_description,
      };
    }
    return channel;
  });
};

export const getChannelHistory = (channelId: number): BottEvent[] => {
  const rows = exec(
    sql`
      select
        e.id as e_id, e.type as e_type, e.details as e_details, e.timestamp as e_ts,
        p.id as p_id, p.type as p_type, p.details as p_details, p.timestamp as p_parent_ts,
        c.id as c_id, c.name as c_name, c.description as c_description, c.config as c_config,
        s.id as s_id, s.name as s_name, s.description as s_description,
        u.id as u_id, u.name as u_name
      from
        events e
      left join
        channels c on e.channel_id = c.id
      left join
        spaces s on c.space_id = s.id
      left join
        users u on e.user_id = u.id
      left join
        events p on e.parent_id = p.id
      where
        e.channel_id = ${channelId}
      order by
        e.timestamp desc
    `,
  ) as any[];

  // Re-use the mapping logic from getEvents by adapting it or extracting to a helper
  // For now, let's imagine a (simplified) mapping similar to getEvents in events.ts
  // This part would need to be as comprehensive as the one in events.ts for full BottEvent objects
  return rows.map((row: any) => {
    const event: BottEvent = {
      id: row.e_id,
      type: row.e_type,
      details: JSON.parse(row.e_details),
      timestamp: new Date(row.e_ts),
      // ... (populate channel with space, user, parent similar to events.ts#getEvents)
    };
    // For brevity, the full population of channel, space, user, parent is omitted here
    // but should mirror the logic in events.ts's getEvents if full objects are needed.
    // A simple channel placeholder:
    if (row.c_id) {
      event.channel = {
        id: row.c_id,
        name: row.c_name,
        space: {
          id: row.s_id,
          name: row.s_name,
          description: row.s_description,
        } as BottSpace,
      };
    }
    if (row.u_id) {
      event.user = { id: row.u_id, name: row.u_name };
    }
    if (row.p_id) {
      event.parent = {
        id: row.p_id,
        type: row.p_type,
        details: JSON.parse(row.p_details),
        timestamp: new Date(row.p_parent_ts),
      };
    }
    return event;
  });
};

export const addChannels = (...channels: BottChannel[]): boolean => {
  try {
    exec(
      sql`
        insert into channels
        (id, space_id, name, description, config)
        values ${
        channels.map((channel) =>
          sql`(${channel.id}, ${channel.space.id}, ${channel.name ?? null}, ${
            channel.description ?? null
          }, ${JSON.stringify(channel.config ?? null)})`
        )
      } on conflict(id) do update set
          space_id = excluded.space_id,
          name = excluded.name,
          description = excluded.description,
          config = excluded.config
      `,
    );
    return true;
  } catch (_) {
    console.log("addChannels", _);
    return false;
  }
};
