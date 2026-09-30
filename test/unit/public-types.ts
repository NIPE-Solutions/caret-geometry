import {
  createCaretVirtualElement,
  getCaretRect,
  observeCaretGeometry,
  type EditableCaretOptions,
  type RangeCaretOptions,
  type SelectionCaretOptions,
  type TextControlCaretOptions,
} from "../../src";

function assertPublicTypes(
  input: HTMLInputElement,
  range: Range,
  selection: Selection,
  editable: HTMLElement,
): void {
  getCaretRect(input, { position: 1 } satisfies TextControlCaretOptions);
  getCaretRect(range, { edge: "end" } satisfies RangeCaretOptions);
  getCaretRect(selection, {
    edge: "anchor",
  } satisfies SelectionCaretOptions);
  getCaretRect(editable, { edge: "focus" } satisfies EditableCaretOptions);
  createCaretVirtualElement(range, { markerFallback: "never" });
  observeCaretGeometry(selection, () => {}, { edge: "focus" });

  // @ts-expect-error Range targets do not accept Selection edges.
  getCaretRect(range, { edge: "focus" });
  // @ts-expect-error Text controls do not accept marker fallback.
  getCaretRect(input, { markerFallback: "never" });
  // @ts-expect-error Selection targets do not accept explicit positions.
  observeCaretGeometry(selection, () => {}, { position: 1 });
}

void assertPublicTypes;
