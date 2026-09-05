export class UnsupportedCaretTargetError extends TypeError {
  override name = "UnsupportedCaretTargetError";
  constructor() {
    super("Caret geometry is not supported for this target.");
  }
}

export class UnsupportedInputTypeError extends TypeError {
  override name = "UnsupportedInputTypeError";
  constructor(type: string) {
    super(`Caret geometry is not supported for input type "${type}".`);
  }
}

export class InvalidCaretPositionError extends RangeError {
  override name = "InvalidCaretPositionError";
  constructor(position: number, length: number) {
    super(
      `Caret position ${position} must be an integer between 0 and ${length}.`,
    );
  }
}
