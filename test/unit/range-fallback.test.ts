import { expect, it } from "vitest";
import { measureRange } from "../../src/range";

it("restores a text node split by marker fallback", () => {
  const children: FakeNode[] = [];
  const text = createTextNode("");
  const restored: unknown[][] = [];
  const selection = {
    anchorNode: text,
    anchorOffset: 0,
    focusNode: text,
    focusOffset: 0,
    setBaseAndExtent(...args: unknown[]) {
      restored.push(args);
    },
  };
  const document = {
    createElement() {
      return createMarker(children);
    },
    getSelection() {
      return selection;
    },
  };
  text.ownerDocument = document;
  children.push(text);

  const range = createRange(text, children);
  const rect = measureRange(range as unknown as Range);

  expect(rect).toMatchObject({ left: 12, top: 8, height: 18 });
  expect(children).toEqual([text]);
  expect(text.data).toBe("");
  expect(restored).toEqual([[text, 0, text, 0]]);
});

interface FakeNode {
  data?: string;
  isConnected?: boolean;
  nextSibling?: FakeNode | null;
  nodeType?: number;
  ownerDocument?: object;
  textContent?: string;
  remove(): void;
}

function createTextNode(data: string): FakeNode {
  const node: FakeNode = {
    data,
    isConnected: true,
    nodeType: 3,
    remove() {},
  };
  Object.defineProperty(node, "textContent", {
    get: () => node.data,
    set: (value: string) => {
      node.data = value;
    },
  });
  return node;
}

function createMarker(children: FakeNode[]): FakeNode & {
  dataset: Record<string, string>;
  getBoundingClientRect(): object;
  setAttribute(): void;
  style: { cssText: string };
} {
  const marker = {
    dataset: {},
    nextSibling: null,
    setAttribute() {},
    style: { cssText: "" },
    textContent: "",
    getBoundingClientRect() {
      return { left: 12, top: 8, right: 12, bottom: 26, width: 0, height: 18 };
    },
    remove() {
      const index = children.indexOf(marker);
      if (index >= 0) children.splice(index, 1);
    },
  };
  return marker;
}

function createRange(text: FakeNode, children: FakeNode[]): object {
  const range = {
    collapsed: true,
    startContainer: text,
    startOffset: 0,
    cloneRange() {
      return createRange(text, children);
    },
    collapse() {},
    getClientRects() {
      return [];
    },
    getBoundingClientRect() {
      return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
    },
    insertNode(marker: FakeNode) {
      const split = createTextNode(text.data ?? "");
      if (text.ownerDocument) split.ownerDocument = text.ownerDocument;
      split.remove = () => {
        const index = children.indexOf(split);
        if (index >= 0) children.splice(index, 1);
      };
      text.data = "";
      marker.nextSibling = split;
      children.splice(0, children.length, text, marker, split);
    },
  };
  return range;
}
