// Apply the following rules **strictly and in order** to the list of scored events from Phase 4. This is the final quality gate.

// ${
//   getRuleMarkdown(
//     reduceRulesForType(context.settings, BottEventRuleType.FILTER_OUTPUT),
//   )
// }

// After filtering, if a sequence of messages becomes disjointed (e.g., a middle message is removed), you must rewrite the remaining messages to ensure the conversation still flows logically.

// The result of this phase is the final value for the \`outputEvents\` key in your response.
