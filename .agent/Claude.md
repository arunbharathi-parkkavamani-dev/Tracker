## ⛔ STEP ZERO — BEFORE ANY TASK (NON-NEGOTIABLE)

> **This block overrides everything below. No exceptions. No shortcuts.**

Before writing ANY code, running ANY grep/search, or reading ANY source file, you MUST:

### 1. Read the System Brain (`knowledge_brain/_SYSTEM/`)

Load the relevant documents based on the task category:

| Task Type | Required System Brain Documents |
|---|---|
| **Any bug diagnosis** | `DIAGNOSTIC_PLAYBOOK.md` + `DANGER_ZONES.md` |
| **Validation / input bug** | `VALIDATION_GAPS.md` + `DANGER_ZONES.md` |
| **Cross-module bug or change** | `SHARED_TABLES.md` + `MODULE_DEPENDENCIES.md` + `CROSS_MODULE_BUGS.md` |
| **Data flow / API bug** | `DATA_FLOW_CHAINS.md` |
| **Business flow / process bug** | `FLOW_CHECKLISTS/{relevant_flow}.md` |
| **Performance issue** | `PERFORMANCE_RISKS.md` |
| **Refactoring / cleanup** | `CLEANUP_GAPS.md` |
| **System audit or review** | `REVIEW_DOCUMENT.md` + `SYSTEM_COVERAGE.md` |

### 2. Read the Module Brain (`knowledge_brain/{module}/`)

If the task is scoped to a specific module, read its `MODULE_BRAIN.md` before touching any source code.

### 3. For Bug Fixes — Activate the Bug Fix Engine Skill

If the task involves fixing a bug (any bug, regardless of how it was reported):

1. **Read** `.agent/skills/bug-fix-engine/SKILL.md` — activates the 4 roles (Debugger → Architect → Developer → Tester) and routes to the correct debug playbook
2. **Search patterns** — check `bug_report_AI/COMMON_BUG_PATTERNS.md` for known fix templates
3. **If pattern found** → use it as the fix starting point, do NOT re-investigate from scratch
4. **If no match** → proceed to manual investigation using the debug playbook from SKILL.md

### 4. THEN proceed with code investigation

Only after Steps 1-3 are complete may you run grep, read source files, or write code.

**Violation of this order is a rule failure** — even if the fix turns out correct, the process was wrong.

---

# Project Rules — CIM (Customer Integrated Management) System

> These rules apply to every conversation in this workspace. They are non-negotiable.

---

## 1. Framework & Coding Standards (React + Vite + Django)

### Frontend (React + TypeScript + Vite)
- This project uses **React 18** with **TypeScript** and **Vite** as the build tool.
- **Always use TypeScript** — never create `.js` or `.jsx` files. Use `.tsx` for components, `.ts` for utilities.
- **Never use `any` type** — define proper interfaces/types in `frontend/src/types/`. If a type doesn't exist, create one.
- Use **functional components only** with React hooks. No class components.
- State management: **React Context** (`context/`) for global state, **TanStack React Query** for server state.
- API calls: Use the **axios instance** from `api/axiosConfig.ts`. Never create new axios instances.
- Routing: All routes are defined in `App.tsx`. Follow existing patterns when adding new routes.
- Styling: Use the existing **CSS approach** (`index.css` and component-level styles). Follow existing patterns.
- **Never import from `node_modules` directly** — use the project's abstraction layers.
- Form handling: Use existing form components from `components/form/` and `FormRenderer.tsx`.

### Backend (Django 5 + DRF)
- This project uses **Django 5.0** with **Django REST Framework**.
- **Always use DRF serializers** — never return raw `JsonResponse` for API endpoints (except special cases like health checks).
- **Always use DRF ViewSets or APIViews** — never use Django function views for API endpoints.
- Follow **DRF conventions**: proper `status` codes, `Response` objects, permission classes.
- Database: **MySQL 8** via `django.db.backends.mysql`. Always use Django ORM — **never write raw SQL** unless the query is genuinely impossible with the ORM.
- Migrations: **Always run `makemigrations --dry-run` first** to preview changes. Never apply migrations without showing them first.
- Authentication: Uses `modern_auth_notifications.authentication.ModernAuthAuthentication` as primary auth.
- **Never modify `settings.py`** without explicit approval — it affects the entire application.
- Use **model managers** for complex queries, not fat views.
- **Business logic belongs in serializers or service layers, not views.** Views orchestrate; serializers/services compute.

---

## 2. API & Data Flow Safety

- **All API responses must use DRF's `Response` class** with appropriate HTTP status codes.
- **Always validate request data** using DRF serializers before any business logic.
- When fixing API bugs, **trace the full data flow**: React component → axios call → DRF View → Serializer → Model → DB.
- **Never change a serializer's field set** without checking all frontend components that consume it.
- **Never change a URL pattern** without checking all frontend API calls that use it.
- **Always handle API errors** on the frontend with proper error boundaries and toast notifications.
- **Pagination is mandatory** for any queryset that could return 100+ records.

---

## 3. Bug Fix Discipline

- **Always consult the Module Brain first** (`knowledge_brain/{module}/`) before investigating any bug. If the brain has the answer, don't waste time re-reading source files.
- When I say **"fix this bug"** without specifying a workflow, default to `/fix-single-bug`.
- **Never fix a bug without identifying the root cause first.** Patching symptoms is unacceptable.
- **Never duplicate an existing component to handle a bug fix or CR.** Instead, add a prop or condition to the existing component.
- **No copy-paste code blocks.** If the same logic (5+ lines) exists in 2 or more places, extract it into a custom hook, utility function, or shared component.
- After any fix, update: `ACTIVE_BUGS.md` status, GitHub issue status, and the Module Brain if the fix changes documented behavior.

---

## 4. Safety & Guardrails

- **Never run destructive database operations** (`DROP TABLE`, `TRUNCATE`, `DELETE` without WHERE) without explicit approval.
- **Never auto-run database migrations.** Always show the migration SQL first.
- **Never modify files in `backend/backend/`** (settings, urls, wsgi, asgi) without explicit approval — these affect the entire application.
- **Never overwrite `.agent/config.md` or `.agent/workflows/`** without approval. These are the system's backbone.
- When modifying a shared component or hook, **check all modules that import it** before changing anything.
- **Never modify `axiosConfig.ts`** — it configures auth headers, CSRF, and interceptors globally.
- **Never modify `AuthContext.tsx`** or `ThemeContext.tsx` without explicit approval — they wrap the entire app.

---

## 5. Documentation & Process

- **Reference bug IDs** (e.g., MST-057, FED-003) in all commit messages, code comments, and status updates.
- When asked to audit a module, follow `/module-bug-audit` — don't improvise a different process.
- When building a Module Brain, follow `/build-module-brain` strictly — the document structure is mandatory.
- **Auto-create `knowledge_brain/{Module}/` directory** if it doesn't exist when starting a brain build.
- Keep `ACTIVE_BUGS.md` and GitHub issues in sync.
- All workflow references must use `{VARIABLE}` placeholders from `.agent/config.md` — no hardcoded paths.
- **Follow workflows completely — no shortcuts.**

---

## 6. Environment Awareness

- **Local variables** (`{PYTHON_PATH}`, `{PROJECT_ROOT}`, `{LOCALHOST_FE}`, `{LOCALHOST_BE}`) are auto-detected by `/validate-workflows` Step 0 and stored in `.agent/.env` (gitignored).
- **Shared variables** (`{FE_SRC}`, `{BE_ROOT}`, etc.) live in `.agent/config.md` (committed).
- **Frontend dev server**: `npm run dev` in `{FE_ROOT}` — runs on port 5173 by default.
- **Backend dev server**: `python manage.py runserver` in `{BE_ROOT}` — runs on port 8000 by default.

---

## 7. Communication Preferences

- When presenting a fix or plan, **show the specific lines changing** — don't just describe what you'll do.
- For business logic bugs, **state the violated business rule in plain English** before showing any code.
- When multiple bugs exist, **prioritize by severity**: Critical → High → Medium → Low.
- If a fix touches more than 3 files, **present an implementation plan** before starting.

---

## 8. Security — Input & Output Hygiene

- **Never trust user input.** Always validate via DRF serializers on the backend.
- **XSS protection**: React handles this by default, but never use `dangerouslySetInnerHTML` without sanitization.
- **CSRF tokens**: The project uses Django CSRF protection with `cim_csrftoken` cookie. Never bypass it.
- **File uploads**: Always validate file type, size, and extension server-side via DRF serializer validators.
- **Authentication**: All API endpoints must require authentication unless explicitly designed as public.

---

## 9. Frontend — React & TypeScript Patterns

- **State management hierarchy**: URL params → React Query (server state) → Context (global client state) → Component state (local).
- **Custom hooks**: Create reusable hooks in `hooks/` for shared logic. Follow the `use{Feature}` naming convention.
- **Component structure**: Pages in `pages/`, reusable components in `components/`, layout in `layout/`.
- **API calls**: Always go through the configured axios instance. Use React Query's `useQuery` and `useMutation` for data fetching.
- **Error handling**: Every API call must handle errors. Use try/catch with proper error toasts.
- **TypeScript interfaces**: Define all API response types. Never use untyped responses.
- **Imports**: Use relative imports within a module, absolute from `src/` root for cross-module imports.

---

## 10. Backend — Django & DRF Patterns

- **ViewSets**: Use `ModelViewSet` for standard CRUD, `ViewSet` for custom endpoints.
- **Serializers**: Always validate data. Use `serializer.is_valid(raise_exception=True)`.
- **Permissions**: Define per-view permissions. Don't rely only on global auth.
- **Queryset optimization**: Use `select_related()` and `prefetch_related()` to avoid N+1 queries.
- **Soft deletes**: Many models use `is_deleted` flags. Always include `is_deleted=False` in queries.
- **Signals**: Use Django signals for side effects (notifications, cache invalidation). Keep views clean.
- **Tests**: Write Django tests using `pytest-django`. Test serializers, views, and business logic separately.

---

## 11. Cross-Module Impact Analysis

- Before modifying any **shared component** (e.g., `FormRenderer`, `TagFilter`, `ImportModal`), **grep all pages** that import it. Present the list of affected modules before making changes.
- Before modifying a **database table** used across modules, **check the Module Registry** in `.agent/config.md` and verify which Django apps reference that table.
- **Shared context providers** (`AuthContext`, `ThemeContext`, `AppSettingsContext`) are global — treat any change as a change to every module.
- When a bug fix in Module A requires a change in Module B's serializer or view, **flag it as a cross-module fix** and get approval before touching Module B.
- **Shared frontend utilities** (`utils/`, `hooks/`, `api/`) follow the same rule — check all consumers before modifying.

---

## 12. Workflow Compliance

- **Never skip a workflow step silently.** If a step must be skipped, state: (a) which step, (b) why, (c) impact.
- **Environment pre-check is always first.** Before any workflow, verify: Python works, Node works, `.agent/.env` values match.
- **Never test against production URLs.** Always use `{LOCALHOST_FE}` / `{LOCALHOST_BE}`.
- **Create a workflow checklist** at the start of every workflow execution. Track each step as TODO/DONE/SKIPPED(reason).

---

## 13. Cross-Conversation Context

- **When resuming a bug fix from a previous conversation**, always read that conversation's walkthrough/artifacts first.
- **Reference previous attempts**: If a fix was attempted and rejected/reverted, the current fix must explain why the previous approach failed.
- **Never re-apply a rejected fix** without explicit human approval.

---

## 14. System Brain — Mandatory Reference (`knowledge_brain/_SYSTEM/`)

> **Non-negotiable:** The `knowledge_brain/_SYSTEM/` directory is the single source of truth for cross-module system knowledge.

### When to Read the System Brain

- **Before any cross-module bug fix or impact analysis** — read `SHARED_TABLES.md` and `MODULE_DEPENDENCIES.md` first.
- **Before diagnosing any bug** — read `DIAGNOSTIC_PLAYBOOK.md`.
- **Before modifying any shared data flow** — read `DATA_FLOW_CHAINS.md`.
- **Before touching any high-risk area** — read `DANGER_ZONES.md`.
- **Before fixing validation or input-handling bugs** — read `VALIDATION_GAPS.md`.
- **Before addressing performance issues** — read `PERFORMANCE_RISKS.md`.
- **Before cleanup or refactoring** — read `CLEANUP_GAPS.md`.

### Rules

- **Never skip the System Brain.** If a task involves more than one module, `MODULE_DEPENDENCIES.md` and `SHARED_TABLES.md` must be read first.
- **If the System Brain contradicts the Module Brain**, flag the discrepancy.
- **Update the System Brain** when a fix changes cross-module behavior.

---

## 15. Mandatory Knowledge Brain Verification & Maintenance

> **Non-negotiable:** The `knowledge_brain/` is the central source of truth for all project contexts and must be kept up-to-date continuously.

- **For every requirement from the user**, you must ONLY execute the task by first verifying the current brain (`e:\Loigmax\CIM\knowledge_brain`).
- **Every update or finding** generated during the task MUST be updated in the brain for future reference.
- **This process must not be missed by any means.**
