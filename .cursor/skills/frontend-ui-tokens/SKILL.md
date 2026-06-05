---
name: frontend-ui-tokens
description: Applies Logimax ERP design tokens from backend/DESIGN.md v2, frontend/src/styles/tokens.css, and uiTokens.js. Enforces theme-aware (light/dark) and responsive layouts on every page. Use when styling React UI, login, shell, forms, dashboards, or fixing black-and-white UI.
---

# Frontend UI Tokens (Logimax ERP)

## Mandatory rules

Every page must be **theme-aware** (light + dark via `ThemeProvider` / `.dark` on `html`) and **responsive** (mobile → tablet → desktop per `DESIGN.md` breakpoints).

Do **not** use pure `#000` / `#FFF` as the only surfaces. Use `bg-canvas`, `bg-surface`, `text-ink`, module accents.

Forms must **not** use `FloatingCard`. Use `{Module}/form.jsx` + `FormPageLayout`.

## Token sources (priority)

1. **`backend/DESIGN.md` v2** — Logimax ERP system (canonical)
2. **`frontend/src/styles/tokens.css`** — CSS variables + component classes
3. **`frontend/src/constants/uiTokens.js`** — module map, `APP_SHELL`, `STAT_CARD`

## Theme-aware checklist

- [ ] All colors via CSS variables (`var(--tracker-ink)`) or Tailwind semantic tokens (`text-ink`, `bg-surface`)
- [ ] Test both `.light` and `.dark` — never hardcode light-only hex without a dark counterpart in `tokens.css`
- [ ] Theme toggle: `useTheme()` from `context/themeProvider.jsx` (top bar + login)
- [ ] Cards, inputs, borders use `--tracker-border`, `--tracker-surface` (auto-switch in `.dark`)

## Responsive checklist

- [ ] App shell: `lmx-app-shell` → sidebar collapses `<1024px`, overlay on mobile
- [ ] Content: `lmx-content` — fluid padding `clamp(16px, 3vw, 32px)`, max-width `1440px`
- [ ] Page headers: stack on mobile (`flex-col sm:flex-row`)
- [ ] Tab bars: `overflow-x-auto scrollbar-hide` on narrow screens
- [ ] Grids: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3/4` per DESIGN.md card-grid
- [ ] Touch targets ≥ 40px on buttons/inputs

## Quick classes

| Use | Class |
|-----|--------|
| App shell | `lmx-app-shell` |
| Page content area | `lmx-content` |
| Top bar | `lmx-topbar` |
| Section card (+ left accent) | `lmx-section-card` or `tracker-card` |
| Plain card (no accent) | `tracker-card-plain` |
| Brand CTA | `tracker-btn-brand` (gradient) |
| Module CTA | `tracker-btn-accent` |
| Secondary | `tracker-btn-secondary` |
| Ghost / icon | `tracker-btn-ghost` |
| Input | `lmx-input` |
| Tabs | `lmx-tab-bar` + `lmx-tab` / `lmx-tab-active` |
| Page eyebrow | `lmx-page-eyebrow` |
| Hero gradient | `lmx-gradient-hero` |

## Module accents (one screen = one module)

Set `data-module="hr|project|ticket|payroll"` on page root to switch `--module-accent`:

| Module | Accent | Use for |
|--------|--------|---------|
| `hr` | `#7C3AED` | Profile, Employees, Attendance, Master HR |
| `project` | `#0EA5E9` | Tasks, Dashboard projects |
| `ticket` | `#E11D48` | Tickets, support |
| `payroll` | `#059669` | Payroll, expenses |

Import `MODULES` from `constants/uiTokens.js`.

## Form layout (no FloatingCard)

| Piece | Path |
|-------|------|
| List view | `{Module}/index.jsx` |
| Form page | `{Module}/form.jsx` |
| Shell | `components/Forms/FormPageLayout.jsx` |
| 8+ fields | `TabbedFormTabs.jsx` (Profile pattern) |
| Route | `entityFormPath(basePath, id?)` |

## Implementation anti-patterns

- ❌ `bg-black`, `text-black`, `dark:bg-black` for chrome
- ❌ Inline `#111111` / `#f5f1ec` (old Intercom tokens)
- ❌ `FloatingCard` for forms
- ❌ Fixed px widths without mobile fallback
- ❌ Light-only colors with no `.dark` token

## Related

- Full spec: `backend/DESIGN.md`
- Brain overview: `.agent/skills/knowledge-brain/design-tokens.md`
