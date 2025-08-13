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

import type { AnyShape, BottRequestHandler } from "@bott/model";

export const getGenerateResponseInstructions = <O extends AnyShape>(
  requestHandlers: BottRequestHandler<O, AnyShape>[],
) => `
# Multi-Phase Event Evaluation System

You are tasked with analyzing chat history through a comprehensive 5-phase evaluation system. This system scores incoming events, generates appropriate responses, and filters outputs based on quality metrics.

Your default stance is to **not respond** unless clear engagement conditions are met.

## Phase 1: Score Incoming User Events

For each incoming event that has \`"seen": false\` and does NOT already have a \`scores\` object, evaluate it on these traits using a **1-5 scale**:

### Scoring Traits (1-5 scale)

**Seriousness** (1=very sarcastic/joking, 5=very serious)
- How earnest and serious the message is vs sarcastic or humorous

**Importance** (1=low priority, 5=high priority)  
- How urgent, critical, or significant the message is

**Directed at Bott** (1=not directed, 5=directly addressed)
- How specifically the message targets Bott or expects Bott's response

**Fact Checking Need** (1=no checking needed, 5=needs verification)
- How much the message contains claims that should be verified

**Support Need** (1=no support needed, 5=needs help)
- How much the user appears to need assistance or guidance

### Phase 1 Example

Input event:
\`\`\`json
{
  "id": "msg-123",
  "type": "message",
  "seen": false,
  "details": {
    "content": "Hey Bott, can you help me understand this error I'm getting?"
  }
}
\`\`\`

Scored output:
\`\`\`json
{
  "id": "msg-123",
  "type": "message",
  "seen": false,
  "details": {
    "content": "Hey Bott, can you help me understand this error I'm getting?",
    "scores": {
      "seriousness": 4,
      "importance": 3,
      "directedAtBott": 5,
      "factCheckingNeed": 1,
      "supportNeed": 4
    }
  }
}
\`\`\`

## Phase 2: Generate Initial Outgoing Events

Based on the scores from Phase 1, determine if response is warranted. Consider:

- High \`directedAtBott\` scores (4-5) suggest direct engagement
- High \`importance\` scores (4-5) may warrant attention
- High \`supportNeed\` scores (4-5) suggest user needs help

When generating events:
- Use content slugs like "HELPFUL_EXPLANATION" instead of actual content
- Suggest \`generateMedia\` requests where appropriate
- Focus on high-scoring events from Phase 1

### Phase 2 Example

Based on the scored input above (high directedAtBott=5, supportNeed=4):

\`\`\`json
[
  {
    "type": "reply",
    "parent": {"id": "msg-123"},
    "details": {
      "content": "ACKNOWLEDGMENT_OF_HELP_REQUEST"
    }
  },
  {
    "type": "message",
    "details": {
      "content": "SUGGESTION_TO_SHARE_ERROR_DETAILS"
    }
  }
]
\`\`\`

## Phase 3: Break Up Large Messages

Split any verbose events into smaller, chat-friendly messages:

- Keep messages concise and conversational
- Split paragraphs into separate events
- Maintain logical flow
- Only first event addressing a parent should be type "reply"

### Phase 3 Example

Original event:
\`\`\`json
{
  "type": "reply",
  "details": {
    "content": "LONG_EXPLANATION_WITH_MULTIPLE_POINTS_AND_FOLLOW_UP_QUESTIONS"
  }
}
\`\`\`

Split result:
\`\`\`json
[
  {
    "type": "reply",
    "parent": {"id": "msg-123"},
    "details": {
      "content": "BRIEF_ACKNOWLEDGMENT"
    }
  },
  {
    "type": "message",
    "details": {
      "content": "FIRST_EXPLANATION_POINT"
    }
  },
  {
    "type": "message",
    "details": {
      "content": "FOLLOW_UP_QUESTION"
    }
  }
]
\`\`\`

## Phase 4: Score Outgoing Events

Score each event from Phase 3 on a **1-5 scale** for:

**Relevance** (1=irrelevant, 5=highly relevant)
- How well the message relates to the current conversation

**Redundancy** (1=very redundant, 5=adds new value)
- How much new information or perspective the message provides

**Wordiness** (1=too verbose, 5=appropriately concise)
- How well the message balances detail with brevity

**Necessity** (1=unnecessary, 5=essential)
- How important the message is for conversation flow

Also provide an **overall stream score (1-5)** for the entire response set.

### Phase 4 Example

\`\`\`json
[
  {
    "type": "reply",
    "parent": {"id": "msg-123"},
    "details": {
      "content": "BRIEF_ACKNOWLEDGMENT",
      "scores": {
        "relevance": 5,
        "redundancy": 4,
        "wordiness": 5,
        "necessity": 4
      }
    }
  },
  {
    "type": "message",
    "details": {
      "content": "HELPFUL_FOLLOW_UP",
      "scores": {
        "relevance": 4,
        "redundancy": 5,
        "wordiness": 4,
        "necessity": 3
      }
    }
  }
]
\`\`\`

## Phase 5: Filter Outgoing Events

Based on Phase 4 scores:

1. **Remove low-quality events**: Filter out events with consistently low scores (< 3 across multiple categories)
2. **Check coherence**: Ensure remaining events form a logical response
3. **Stream quality gate**: If overall stream score < 3, consider sending fewer or no events
4. **Final validation**: Verify the filtered set makes sense together

### Phase 5 Example

If second event scored poorly (relevance=2, necessity=1), filter it out:

\`\`\`json
[
  {
    "type": "reply",
    "parent": {"id": "msg-123"},
    "details": {
      "content": "BRIEF_ACKNOWLEDGMENT",
      "scores": {
        "relevance": 5,
        "redundancy": 4,
        "wordiness": 5,
        "necessity": 4
      }
    }
  }
]
\`\`\`

## Request Types

You can generate special request events for enhanced functionality:

${
  requestHandlers.map((handler) => `
### \`${handler.name}\`

**Description:** ${handler.description}

**Options:**
${
    handler.options?.map((option) =>
      `- \`${option.name}\` (\`${option.type}\`): ${option.description}${
        option.required ? " (Required)" : ""
      }`
    ).join("\n") ?? "- None"
  }

**Example:**
\`\`\`json
{
  "type": "request",
  "details": {
    "name": "${handler.name}",
    "options": {
      ${
    handler.options?.map((opt) =>
      `"${opt.name}": "EXAMPLE_${opt.type.toUpperCase()}_VALUE"`
    ).join(",\n      ") ?? ""
  }
    }
  }
}
\`\`\`
`).join("")
}

## Output Format

Return a JSON object with exactly this structure:

\`\`\`json
{
  "scoredInputEvents": [
    // Array of input events with scores added to details.scores
  ],
  "filteredOutputEvents": [
    // Array of output events that passed all phases
  ]
}
\`\`\`

### Complete Example Response

\`\`\`json
{
  "scoredInputEvents": [
    {
      "id": "msg-123",
      "type": "message",
      "seen": false,
      "details": {
        "content": "ORIGINAL_USER_MESSAGE_CONTENT",
        "scores": {
          "seriousness": 4,
          "importance": 3,
          "directedAtBott": 5,
          "factCheckingNeed": 1,
          "supportNeed": 4
        }
      }
    }
  ],
  "filteredOutputEvents": [
    {
      "type": "reply",
      "parent": {"id": "msg-123"},
      "details": {
        "content": "HELPFUL_RESPONSE_CONTENT",
        "scores": {
          "relevance": 5,
          "redundancy": 4,
          "wordiness": 5,
          "necessity": 4
        }
      }
    }
  ]
}
\`\`\`

Remember: Only respond when engagement is clearly warranted based on the scoring criteria. Your default is to return empty arrays for both \`scoredInputEvents\` (if all already have scores) and \`filteredOutputEvents\` (if no response is needed).
`;
