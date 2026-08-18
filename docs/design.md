# Design system

DSH Mobile should feel at home next to DeepSeek Harness without copying the upstream frontend or depending on its implementation details.

## Principles

- Quiet, tool-like hierarchy aligned with the official DeepSeek aesthetic.
- Dense enough for technical users, but never cramped.
- Clear connection/security state before visual flourish.
- Light and dark themes are first-class.
- The official DSH Web UI remains visually dominant while a server is open.
- App-owned screens must not imitate endorsement or reuse protected upstream brand assets.

## Source of visual inspiration

The palette and interface elements align with the official DeepSeek Harness aesthetic:

Core tokens:

- dark background: `#0A0A0A` (DeepSeek ultra-dark slate)
- brand blue accent: `#6799FE`
- brand primary blue: `#4D6BFE`
- deep brand blue: `#3A65C2`
- light surface: `#F8FAFC`
- border dark: `#1A1D24`
- border light: `#E2E8F0`

## Components

The native shell deliberately stays focused:

- **Brand mark:** dynamic in-app logo displaying the high-contrast white whale in dark mode and vibrant blue whale in light mode;
- **App buttons:** DeepSeek-style full-pill buttons (`borderRadius: 100`) with high-contrast white primary pill in dark mode and glass secondary pill;
- **Ambient glow:** subtle 360° SVG radial gradient aura behind the central whale empty state;
- **Server card & Status pill:** crisp connectivity and security indicators;
- **Text field & Segmented control:** streamlined native inputs;
- **Section card:** structured grouping for settings and details;
- **Browser recovery state:** resilient error handling with retry/reconnect actions.

## Motion & Accessibility

Use smooth platform navigation transitions and subtle micro-interactions. Text contrast strictly meets WCAG AA standards in both light and dark themes. Interactive touch targets are comfortably tappable.
