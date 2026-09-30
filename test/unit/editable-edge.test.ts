import { expect, it } from "vitest";
import { getCaretRect } from "../../src/get-caret-rect";
import { createCaretVirtualElement } from "../../src/virtual";

it("measures the requested editable selection endpoint", () => {
  const fixture = createSelectionFixture();

  expect(getCaretRect(fixture.root, { edge: "anchor" })?.left).toBe(10);
  expect(getCaretRect(fixture.root, { edge: "focus" })?.left).toBe(50);
});

it("uses the requested selection endpoint as virtual layout context", () => {
  const fixture = createSelectionFixture();

  const virtual = createCaretVirtualElement(fixture.selection, {
    edge: "anchor",
  });

  expect(virtual?.contextElement).toBe(fixture.anchorParent);
});

function createSelectionFixture() {
  const anchorParent = { nodeType: 1 };
  const focusParent = { nodeType: 1 };
  const document = {
    createRange: () => createRange(),
    getSelection: () => selection,
  };
  const anchor = {
    nodeType: 3,
    ownerDocument: document,
    parentElement: anchorParent,
    rect: createRect(10),
  };
  const focus = {
    nodeType: 3,
    ownerDocument: document,
    parentElement: focusParent,
    rect: createRect(50),
  };
  const selection = {
    anchorNode: anchor,
    anchorOffset: 1,
    focusNode: focus,
    focusOffset: 2,
    getRangeAt() {},
  };
  const root = {
    nodeType: 1,
    tagName: "DIV",
    isContentEditable: true,
    ownerDocument: document,
    contains: (node: unknown) => node === anchor || node === focus,
  };

  return {
    anchorParent: anchorParent as unknown as Element,
    root: root as unknown as HTMLElement,
    selection: selection as unknown as Selection,
  };
}

function createRange() {
  let node: { rect: DOMRect } | undefined;
  let offset = 0;
  return {
    collapsed: true,
    get startContainer() {
      return node;
    },
    get startOffset() {
      return offset;
    },
    setStart(nextNode: { rect: DOMRect }, nextOffset: number) {
      node = nextNode;
      offset = nextOffset;
    },
    collapse() {},
    cloneRange() {
      const clone = createRange();
      clone.setStart(node!, offset);
      return clone;
    },
    getClientRects() {
      return [node!.rect];
    },
    getBoundingClientRect() {
      return node!.rect;
    },
  };
}

function createRect(left: number): DOMRect {
  return {
    x: left,
    y: 4,
    left,
    right: left,
    top: 4,
    bottom: 20,
    width: 0,
    height: 16,
  } as DOMRect;
}
