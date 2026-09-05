import { InvalidCaretPositionError, UnsupportedInputTypeError } from "./errors";

const SUPPORTED_INPUT_TYPES = new Set(["text", "search", "tel", "url"]);

export function isSupportedInputType(
  type: string,
  throwOnUnsupported = false,
): boolean {
  const supported = SUPPORTED_INPUT_TYPES.has(type.toLowerCase());
  if (!supported && throwOnUnsupported)
    throw new UnsupportedInputTypeError(type.toLowerCase());
  return supported;
}

export function assertPosition(position: number, length: number): void {
  if (!Number.isInteger(position) || position < 0 || position > length) {
    throw new InvalidCaretPositionError(position, length);
  }
}

export interface TextControlSelection {
  readonly selectionStart: number | null;
  readonly selectionEnd: number | null;
  readonly selectionDirection: "forward" | "backward" | "none" | null;
}

export function getDefaultTextControlPosition(
  control: TextControlSelection,
): number | null {
  if (control.selectionStart === null || control.selectionEnd === null)
    return null;
  return control.selectionDirection === "backward"
    ? control.selectionStart
    : control.selectionEnd;
}

export function tagName(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { nodeType?: unknown; tagName?: unknown };
  return candidate.nodeType === 1 && typeof candidate.tagName === "string"
    ? candidate.tagName.toLowerCase()
    : null;
}
