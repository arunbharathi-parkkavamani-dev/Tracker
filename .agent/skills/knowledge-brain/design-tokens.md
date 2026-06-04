# UI Design Tokens (Tracker)

| Layer | Path |
|-------|------|
| CSS + Tailwind utilities | `frontend/src/styles/tokens.css` |
| Profile palette (JS) | `frontend/src/constants/uiTokens.js` |
| Agent skill | `.agent/skills/frontend-ui-tokens/SKILL.md` |
| Marketing spec | `backend/DESIGN.md` |

Use semantic classes (`bg-canvas`, `text-ink`, `tracker-btn-accent`) — not `bg-black` / pure `#000` / `#fff` for app UI.

## When to load

- New or restyled pages/components in `frontend/src/`
- Buttons, cards, forms, nav, marketing-style sections
- User asks for consistent Tracker / Intercom-inspired UI

## Core palette (map to CSS variables or Tailwind)

| Token | Hex | Role |
|-------|-----|------|
| `{colors.canvas}` | `#f5f1ec` | Page background (not pure white) |
| `{colors.surface-1}` | `#ffffff` | Cards, inputs |
| `{colors.surface-2}` | `#ebe7e1` | Tinted panels |
| `{colors.ink}` | `#111111` | Primary text, charcoal CTAs |
| `{colors.ink-muted}` | `#626260` | Secondary text |
| `{colors.hairline}` | `#d3cec6` | Card borders |
| `{colors.fin-orange}` | `#ff5600` | **Fin AI CTAs only** |

## Typography

- Display/headlines: Saans weight **500**, negative letter-spacing per `typography.display-*`
- Body: Saans weight **400**, `{typography.body}` 16px default
- Substitute if Saans unavailable: Inter, Geist, or similar geometric sans

## Radius

| Token | px | Use |
|-------|-----|-----|
| `{rounded.md}` | 8 | Buttons, inputs |
| `{rounded.lg}` | 12 | Standard cards |
| `{rounded.xl}` | 16 | Product/mockup tiles |
| `{rounded.pill}` | 9999 | Pricing tabs only — **not** primary CTAs |

## Component tokens

Reference by name from `DESIGN.md` `components:` section:

- Primary CTA: `button-primary` (`{colors.ink}` bg)
- Secondary: `button-secondary` (white + hairline border)
- Fin product CTA: `button-fin` only
- Cards: `feature-card`, `product-mockup-card`, `pricing-card`
- Inputs: `text-input` / `text-input-focused`
- Nav: `top-nav` (56px, canvas bg)

## Do / Don't (enforced)

**Do:** cream canvas; white lifted cards; hairline borders; no drop shadows on cards; product screenshots as hero content where relevant.

**Don't:** pure white page canvas; Fin Orange as generic primary CTA; pill-shaped primary buttons; drop shadows on floating cards; charcoal + Fin Orange CTAs in same viewport.

## Implementing in React

1. Read the matching `components.*` block in `backend/DESIGN.md`
2. Map tokens to `frontend/src/index.css` variables or existing utility classes
3. Prefer reusing `frontend/src/components/Common/*` before new primitives
4. After editing `DESIGN.md`: `npx @google/design.md lint DESIGN.md`

## Profile page palette (people-centric UI)

Source: `frontend/src/pages/Profile/index.jsx` — use `SECTION_GRADIENTS` / `PROFILE_PAGE` from `uiTokens.js`.

| Token | Value / class |
|-------|----------------|
| Canvas light | `gray-50` / `bg-canvas-muted` |
| Canvas dark | `#09090b` |
| Surface dark | `#111113` |
| Hero | `indigo-600 → purple-600 → cyan-500` |
| Progress / ring | `#6366f1` → `#06b6d4` |
| Section bars | indigo, emerald, amber, rose, cyan gradients |
| Active tab | white + `text-indigo-600` |

Accent actions on master-data lists: `tracker-btn-accent` (indigo). Shell/forms: `tracker-btn-primary` (charcoal ink).

## Brain note

UI-only changes rarely need `DATA_FLOW.md` updates unless API contracts change. Mention new shared UI patterns in `knowledge_brain/Common/MODULE_BRAIN.md` if they affect multiple modules.
