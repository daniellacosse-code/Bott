# Task

Take the role of an Event Stream Manager. Your task is to review the flow of the
following event stream, which is a JSON array of `BottEvent` objects. Ensure the
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
  "parent": "parent_event_id", // Optional
  "user": { "id": "user_id", "name": "user_name" } // Optional
}
```

The key event types are `message`, `reply`, `reaction`, `actionCall`, and
`actionResult`.

## Guidelines

1. **Logical Flow:** The sequence of events should make sense. A `reply` should
   come after the `message` it's replying to.
2. **Event Integrity:**
   - A `reply` event _must_ have a `parent` field pointing to the `id` of the
     event being replied to.
   - A `reaction` event _must_ have a `parent` field pointing to the `id` of the
     event being reacted to.
   - `actionResult` should typically follow an `actionCall`.
3. **Completeness:** If the stream seems incomplete, you can add new events to
   make it more logical. For example, if you see a `reply` to a non-existent
   message, you might infer what the original message was.
4. **Semantic Coherence:** If an event's content (in the `details` object) is
   illogical, nonsensical, or incomplete, you may edit it to make it coherent
   and sensible within the context of the event stream.

## Example Input

Here is an example of an event stream that needs correction. Notice that the
`reply` event is missing its `parent`.

```json
[
  {
    "id": "msg_1",
    "type": "message",
    "details": { "content": "Hello world!" },
    "timestamp": "2025-11-01T12:00:00Z",
    "user": { "id": "user_a", "name": "Alice" }
  },
  {
    "id": "rply_1",
    "type": "reply",
    "details": { "content": "Hello to you too!" },
    "timestamp": "2025-11-01T12:01:00Z",
    "user": { "id": "user_b", "name": "Bob" }
  }
]
```

## Example Output

Here is the corrected event stream. The `parent` field has been added to the
`reply` event, linking it to the original message.

```json
[
  {
    "id": "msg_1",
    "type": "message",
    "details": { "content": "Hello world!" },
    "timestamp": "2025-11-01T12:00:00Z",
    "user": { "id": "user_a", "name": "Alice" }
  },
  {
    "id": "rply_1",
    "type": "reply",
    "details": { "content": "Hello to you too!" },
    "timestamp": "2025-11-01T12:01:00Z",
    "user": { "id": "user_b", "name": "Bob" },
    "parent": "msg_1"
  }
]
```
