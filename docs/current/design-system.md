# Design system

Phase 0 UI is a minimal status page. Product design tokens (for Phase 3 chat) are captured below from project design intent.

## Principles

- Clarity first, professional SOC tool aesthetic
- Dark theme, content-focused chat (Phase 3)
- Accessible (WCAG-oriented targets for full UI)

## Colours (product palette)

| Hex | Role |
| --- | --- |
| `#1A1A2E` | Page background |
| `#16213E` | Cards / AI bubbles / code panels |
| `#0F3460` | User bubbles / interactive depth |
| `#E94560` | Accent / primary button |
| `#EAEAEA` | Secondary text |
| `#FFFFFF` | Primary text |
| `#4CAF50` / `#F44336` / `#FFC107` | Success / error / warning |

## Typography

- Primary: system-ui / Inter (planned)
- Monospace: JetBrains Mono (planned for logs/JSON)

## Phase 0 components (implemented)

- Centered status page title
- Primary button “Check backend health” (`#E94560`)
- JSON result `<pre>` on dark panel
- Error text in red

## Phase 3 planned components

- Chat header + connection status
- Message list (user right / AI left)
- Input + send
- Streaming indicators
- Error banners with retry

## Accessibility targets (full UI)

- Keyboard send (Enter), shift+enter newline
- Visible focus, contrast ≥ 4.5:1 for body text
