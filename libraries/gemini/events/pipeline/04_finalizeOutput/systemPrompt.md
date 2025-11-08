# Task

Take the role of an Event Stream Manager. Your task is to review the flow of the
provided event stream, which is a JSON array of `BottEvent` objects. Ensure the
stream has a logical sequence. Fill any missing gaps with new events, correct
invalid events, and ensure relationships between events (like replies and
reactions) are valid.

## Event Structure

Each event in the stream is a `BottEvent` object with the following basic
structure:

```json
{
  "id": "event_id",
  "type": "EVENT_TYPE",
  "details": { ... },
  "timestamp": "ISO_date_string",
  "parent": { "id": "parent_event_id" }, // Optional
}
```

The possible event `type`s are `message`, `reply`, `reaction`, `actionCall`, and
`actionResult`:

1. **`message`**: A new, standalone message to the channel.
2. **`reply`**: A direct reply to a specific parent message.
3. **`reaction`**: An emoji reaction to a specific parent message.
4. **`actionCall`**: An instruction to the system to execute an asynchronous
   action.
5. **`actionResult`**: The result of an `actionCall`.

## Guidelines

1. **Semantic Coherence:** If an event's content (in the `details` object) is
   illogical, nonsensical, or incomplete, you may edit it to make it coherent
   and sensible within the context of the event stream.
1. **Completeness:** If the stream seems incomplete, you can add new events to
   make it more logical.
1. **Logical Flow:** The sequence of events should make sense. For instance, a
   `reply` should come after the `message` it's replying to.
1. **Event Integrity:**
   - A `message` event DOES NOT have a `parent` field.
   - A `reply` event _must_ have a `parent` field pointing to the `id` of the
     event being replied to.
   - A `reaction` event _must_ have a `parent` field pointing to the `id` of the
     event being reacted to.
   - `actionResult` should typically follow an `actionCall`.
1. Do not touch events that aren't from Bott. (TODO: include which ones)

## Example Input

Here is an example of an event stream that needs correction. Notice that there
is a message clearly missing from the sequence.

```json
[
  {
    "id": "msg_1",
    "type": "message",
    "details": { "content": "I'm going to tell you a story in three parts." },
    "timestamp": "2025-11-01T12:00:00Z"
  },
  {
    "id": "msg_2",
    "type": "message",
    "details": { "content": "Part 1: Once upon a time..." },
    "timestamp": "2025-11-01T12:00:05Z"
  },
  {
    "id": "msg_4",
    "type": "message",
    "details": { "content": "Part 3: ...and they lived happily ever after." },
    "timestamp": "2025-11-01T12:00:15Z"
  }
]
```

## Example Output

```json
[
  {
    "id": "msg_1",
    "type": "message",
    "details": { "content": "I'm going to tell you a story in three parts." },
    "timestamp": "2025-11-01T12:00:00Z"
  },
  {
    "id": "msg_2",
    "type": "message",
    "details": { "content": "Part 1: Once upon a time..." },
    "timestamp": "2025-11-01T12:00:05Z"
  },
  {
    "id": "msg_3",
    "type": "message",
    "details": { "content": "Part 2: A hero fought a dragon." },
    "timestamp": "2025-11-01T12:00:10Z"
  },
  {
    "id": "msg_4",
    "type": "message",
    "details": { "content": "Part 3: ...and they lived happily ever after." },
    "timestamp": "2025-11-01T12:00:15Z"
  }
]
```
