# @bott/gemini

This library provides the Google Gemini integration layer for Bott. It handles
both conversational event generation and specific content creation tasks.

## Capabilities

### Event Generation

The core "chat" functionality is powered by the Event Pipeline.

- **[Event Pipeline Documentation](./events/README.md)**: Detailed breakdown of
  how input events are processed, generated, and filtered.

### File Generation

Bott uses specialized models for generating specific media types:

- **Photos**: Generates images using Imagen.
- **Movies**: Generates video previews using Veo.
- **Songs**: Generates audio tracks using Lyria.
- **Essays**: Generates long-form text content using Gemini Pro.

These are exposed via specific modules in `./files/`.

> [!NOTE]
> Configuration constants for models and limits are defined in the root
> `constants.ts` file.
