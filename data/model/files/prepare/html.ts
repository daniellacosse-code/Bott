import { extractFromHtml } from "npm:@extractus/article-extractor";
import {
  DOMParser,
  type Element,
  Node,
  type NodeList,
} from "jsr:@b-fuze/deno-dom";

type FileDataTransformer = (data: Uint8Array) => Promise<Uint8Array | null>;

const ALLOWED_ELEMENT_TAGS = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "caption",
  "cite",
  "code",
  "dd",
  "dl",
  "dt",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "small",
  "strike",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
]);

const _makeNodeProcessingQueue = (nodes: NodeList, parent: Element) => {
  const result = [];

  for (const node of nodes) {
    result.push({
      node,
      parent,
    });
  }

  return result;
};

export const prepareHtml: FileDataTransformer = async (data) => {
  const htmlText = new TextDecoder().decode(data);

  const { content, title, description, author } =
    await extractFromHtml(htmlText) ?? {};

  if (!content) return null;

  const sourceDocument = new DOMParser().parseFromString(content, "text/html");
  const resultDocument = new DOMParser().parseFromString(
    "<body></body>",
    "text/html",
  );

  if (!sourceDocument || !resultDocument) return null;

  let queue = _makeNodeProcessingQueue(
    sourceDocument.body.childNodes,
    resultDocument.body,
  );

  while (queue.length) {
    const { node: sourceNode, parent: resultParent } = queue.shift() as {
      node: Node;
      parent: Element;
    };

    switch (sourceNode?.nodeType) {
      case Node.ELEMENT_NODE: {
        const sourceElement = sourceNode as Element;
        const sourceElementTag = sourceElement.tagName.toLowerCase();

        if (ALLOWED_ELEMENT_TAGS.has(sourceElementTag)) {
          const resultElement = resultDocument.createElement(sourceElementTag);

          resultParent.appendChild(resultElement);

          queue = [
            ...queue,
            ..._makeNodeProcessingQueue(
              sourceElement.childNodes,
              resultElement,
            ),
          ];
          break;
        }

        queue = [
          ...queue,
          ..._makeNodeProcessingQueue(sourceElement.childNodes, resultParent),
        ];
        break;
      }
      case Node.TEXT_NODE:
        resultParent.appendChild(sourceNode);
        break;
      default:
        continue;
    }
  }

  const titleHtml = title ? `<h1>${title}</h1>\n` : "";
  const descriptionHtml = description ? `<p>${description}</p>\n` : "";
  const authorHtml = author ? `<p><em>By: ${author}</em></p>\n` : "";

  // TODO: cap text length
  const finalHtml =
    `${titleHtml}${descriptionHtml}${authorHtml}${resultDocument.body.innerHTML}`;

  return new TextEncoder().encode(finalHtml.trim());
};
