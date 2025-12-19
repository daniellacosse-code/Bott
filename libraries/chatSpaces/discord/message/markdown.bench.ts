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

import { getMarkdownLinks } from "./markdown.ts";

// Test data for benchmarks
const noLinks = "This is a simple text with no links at all.";
const singleLink = "Check out [Google](https://google.com) for more info.";
const multipleLinks = `
Visit [Google](https://google.com) and [GitHub](https://github.com).
Also check https://example.com and http://test.org.
Images: ![Logo](https://example.com/logo.png)
`;
const codeWithLinks = `
Some text with code:
\`\`\`
https://code-example.com/api
http://another.example.com
\`\`\`
And inline code: \`https://inline.example.com\`
`;
const longTextWithManyLinks = `
# Documentation

Visit our website at https://example.com for more information.
Check the API docs at https://api.example.com/docs.
View our GitHub at https://github.com/example/repo.
Read the blog at https://blog.example.com.
Support: https://support.example.com.

## Links

- [Home](https://example.com/home)
- [About](https://example.com/about)
- [Contact](https://example.com/contact)
- [FAQ](https://example.com/faq)

Images:
![Image1](https://example.com/img1.png)
![Image2](https://example.com/img2.jpg)

More plaintext URLs:
http://test1.com http://test2.com http://test3.com
www.example1.org www.example2.org www.example3.org
`;
const complexMarkdown = `
# Complex Document

Paragraph with mixed content: visit https://example.com or [click here](https://link.example.com).
Code block:
\`\`\`javascript
const url = "https://code.example.com";
fetch(url);
\`\`\`

Inline: \`https://inline.example.com\` and more text.

List:
- Item with https://list-item1.com
- Item with [link](https://list-item2.com)
- Item with ![img](https://list-item3.com/img.png)
`;

Deno.bench("getMarkdownLinks - no links", () => {
  getMarkdownLinks(noLinks);
});

Deno.bench("getMarkdownLinks - single link", () => {
  getMarkdownLinks(singleLink);
});

Deno.bench("getMarkdownLinks - multiple links", () => {
  getMarkdownLinks(multipleLinks);
});

Deno.bench("getMarkdownLinks - code blocks with links", () => {
  getMarkdownLinks(codeWithLinks);
});

Deno.bench("getMarkdownLinks - long text with many links", () => {
  getMarkdownLinks(longTextWithManyLinks);
});

Deno.bench("getMarkdownLinks - complex markdown", () => {
  getMarkdownLinks(complexMarkdown);
});

Deno.bench("getMarkdownLinks - empty string", () => {
  getMarkdownLinks("");
});

Deno.bench("getMarkdownLinks - large text no links", () => {
  const largeText = "Lorem ipsum dolor sit amet. ".repeat(500);
  getMarkdownLinks(largeText);
});
