# Design system

DSH Mobile should feel at home next to DeepSeek Harness without copying the upstream frontend or depending on its implementation details.

## Principles

- Quiet, tool-like hierarchy rather than decorative mobile chrome.
- Dense enough for technical users, but never cramped.
- Clear connection/security state before visual flourish.
- Light and dark themes are first-class.
- The official DSH Web UI remains visually dominant while a server is open.
- App-owned screens must not imitate endorsement or reuse protected upstream brand assets.

## Source of visual inspiration

The initial palette is derived from public design tokens visible in the upstream DeepSeek Harness `ui-theme` package. DSH Mobile copies only a small set of general-purpose color values into its own independent theme layer; it does not import upstream CSS, selectors, components, fonts, or runtime assets.

Core accents:

- brand blue: `#4176E6`
- dark-mode brand blue: `#5686FE`
- light foreground: `#0F1115`
- dark background: `#0F1115`

These values are implementation details of DSH Mobile's own design system and may evolve independently.

## Components

The native shell deliberately stays small:

- brand mark;
- server card;
- status pill;
- text field;
- segmented control;
- section card;
- primary/secondary/destructive buttons;
- small icon buttons;
- browser recovery state.

Before adding a new component, check whether an existing primitive can express the interaction clearly.

## Motion

Use platform navigation transitions and subtle pressed states. Avoid attention-seeking animation around the WebView or connection status.

## Accessibility

Interactive controls require meaningful labels/roles. Text contrast must remain legible in both themes, touch targets should be comfortably tappable, and status must not be communicated by color alone.
