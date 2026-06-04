---
name: frontend-ui-tokens
description: Applies Tracker frontend design tokens from frontend/src/styles/tokens.css, backend/DESIGN.md, and the Profile page palette (Profile/index.jsx). Use when styling React pages, components, forms, dashboards, or fixing harsh black-and-white UI.
---

# Frontend UI Tokens (Tracker)

## Token sources (priority)

1. **CSS variables** — `frontend/src/styles/tokens.css` (semantic utilities: `bg-canvas`, `text-ink`, `border-hairline`, `tracker-btn-primary`)
2. **Profile palette** — `frontend/src/pages/Profile/index.jsx` + `frontend/src/constants/uiTokens.js`
3. **Marketing / shell spec** — `backend/DESIGN.md` (cream canvas `#f5f1ec`, ink `#111111`, hairlines)

Do **not** default to `bg-black`, `text-black`, `dark:bg-black`, or `#000` / `#fff` for app chrome. Use ink/canvas/accent tokens.

## Quick classes

| Use | Class |
|-----|--------|
| App shell background | `bg-canvas text-ink` |
| Profile-style page | `tracker-page` or `PROFILE_PAGE.canvasLight` + `canvasDark` |
| Card | `tracker-card` or `tracker-card-profile` |
| Primary submit (charcoal) | `tracker-btn-primary` |
| Accent CTA (indigo) | `tracker-btn-accent` |
| Secondary | `tracker-btn-secondary` |
| Modal backdrop | `tracker-overlay` (not `bg-black/50`) |
| Progress / highlights | `tracker-gradient-progress` or `from-indigo-500 to-cyan-500` |

## Profile section accents

From Profile `Card` — import `SECTION_GRADIENTS` from `constants/uiTokens.js`:

| Key | Gradient |
|-----|----------|
| `indigo` | Basic / default sections |
| `emerald` | Work, bank, success |
| `amber` | Dates, documents, warnings |
| `rose` | Family / personal |
| `cyan` | Address / location |

Top bar accent: `indigo-500` / `indigo-400` (dark). Hero: `PROFILE_PAGE.heroGradient`.

## DESIGN.md vs Profile

| Context | Prefer |
|---------|--------|
| Main app (sidebar, dashboard, master data) | DESIGN tokens — cream canvas, charcoal primary buttons |
| People-centric pages (profile, teams, HR cards) | Profile tokens — gray-50 / `#09090b` dark, indigo–cyan gradients |
| Fin / AI-only CTA | `backend/DESIGN.md` `button-fin` `#ff5600` only |

## Implementation checklist

- [ ] Replace `bg-black` / `dark:bg-black` with `bg-canvas` / `dark:bg-canvas` or `bg-surface`
- [ ] Replace `text-black` with `text-ink` or `text-gray-800 dark:text-gray-200`
- [ ] Replace hardcoded `#111111` in new code with `text-ink` or `var(--tracker-ink)`
- [ ] Modals: `tracker-overlay` instead of `bg-black/50`
- [ ] Primary buttons in forms: `tracker-btn-primary` (FormRenderer pattern)
- [ ] List/stat cards: `STAT_CARD` from `uiTokens.js` or `tracker-card`

## Related

- Brain + DESIGN overview: `.agent/skills/knowledge-brain/design-tokens.md`
- Full DESIGN spec: `backend/DESIGN.md`
