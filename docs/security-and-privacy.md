# Security and privacy

The library must read a supported text control's value to reproduce browser text layout. It uses that text synchronously in a hidden, non-interactive mirror, does not parse it as HTML, and clears it before the call returns—even when measurement fails.

It never logs, transmits, or persists field text. It includes no telemetry and makes no network calls. Per-document infrastructure is held through `WeakMap`; arbitrary controls and values are not retained. Password controls are rejected before reading their value.
