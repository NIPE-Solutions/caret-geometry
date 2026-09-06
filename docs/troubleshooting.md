# Troubleshooting caret-anchored UI

## Popup follows typing but not page scroll

Only caret observation is installed. Add the positioning engine's environmental
auto-update mechanism.

## Popup follows scroll but not typing or arrow keys

Only environmental auto-update is installed. Subscribe with
`observeCaretGeometry()`.

## Popup appears at the viewport origin

Positioning started without valid caret geometry. Create the virtual reference
only when possible and hide the popup whenever `getCaretRect()` returns `null`.
Do not interpret retained last-valid virtual geometry as current validity.

## Popup follows the input element rather than the caret

The input element itself was passed as the positioning reference. Pass the
Caret Geometry virtual reference instead.
