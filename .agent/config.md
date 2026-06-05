# Central Configuration — CIM Bug Remediation & Development System

> **All workflows reference this file for project-level values.**
> **Local/machine-specific values are auto-detected in `.agent/.env` (see Pre-Flight in `/validate-workflows`).**

## Project Identity

| Variable          | Value                                                     |
| ----------------- | --------------------------------------------------------- |
| `{PROJECT_ROOT}`  | `D:\customer_integrated_management\customer_integrated_management` |
| `{PROJECT_NAME}`  | `customer_integrated_management`                          |
| `{REPO_OWNER}`    | `Logimax-Hub`                                             |
| `{REPO_NAME}`     | `customer_integrated_management`                          |
| `{FRAMEWORK}`     | `React 18 + Vite (Frontend) / Django 5 + DRF (Backend)`  |
| `{LOCALHOST_FE}`  | `http://localhost:5173`                                   |
| `{LOCALHOST_BE}`  | `http://localhost:8000`                                   |

## Tech Stack

| Layer       | Technology                                           |
| ----------- | ---------------------------------------------------- |
| Frontend    | React 18 + TypeScript + Vite                         |
| UI          | Custom CSS + Tailwind (some modules)                 |
| State       | React Context + TanStack React Query                 |
| Routing     | React Router (inside `App.tsx`)                      |
| DnD         | react-dnd + HTML5Backend                             |
| Backend     | Django 5.0 + Django REST Framework                   |
| Auth        | Token Auth (`modern_auth_notifications`)             |
| WebSocket   | Django Channels + Daphne (ASGI)                      |
| DB          | MySQL 8 (utf8mb4)                                    |
| Storage     | Local (dev) / S3 (staging/prod)                      |
| Task Queue  | Celery + Redis                                       |
| Cache       | Redis (staging/prod) / LocMem (dev)                  |

## Environment Paths

| Variable              | Value                           | Used By                           |
| --------------------- | ------------------------------- | --------------------------------- |
| `{PYTHON_PATH}`       | *(auto-detected by /validate)*  | test-and-verify, backend commands |
| `{NODE_PATH}`         | *(auto-detected by /validate)*  | frontend lint, build              |
| `{NPM_PATH}`          | *(auto-detected by /validate)*  | frontend install, dev server      |
| `{MANAGE_PY}`         | `backend/manage.py`             | Django management commands        |
| `{PYTEST_PATH}`       | `pytest`                        | test-and-verify                   |

## Directory Structure

| Variable              | Value                                   | Purpose                     |
| --------------------- | --------------------------------------- | --------------------------- |
| `{FE_ROOT}`           | `frontend/`                             | React+Vite app root         |
| `{FE_SRC}`            | `frontend/src/`                         | Source code                  |
| `{FE_PAGES}`          | `frontend/src/pages/`                   | Page-level components        |
| `{FE_COMPONENTS}`     | `frontend/src/components/`              | Reusable UI components       |
| `{FE_API}`            | `frontend/src/api/`                     | Axios config + API helpers   |
| `{FE_SERVICES}`       | `frontend/src/services/`               | Service layer                |
| `{FE_HOOKS}`          | `frontend/src/hooks/`                   | Custom React hooks           |
| `{FE_CONTEXT}`        | `frontend/src/context/`                | React Context providers      |
| `{FE_TYPES}`          | `frontend/src/types/`                   | TypeScript type definitions  |
| `{FE_UTILS}`          | `frontend/src/utils/`                   | Utility functions            |
| `{FE_LAYOUT}`         | `frontend/src/layout/`                  | Layout components            |
| `{BE_ROOT}`           | `backend/`                              | Django project root          |
| `{BE_SETTINGS}`       | `backend/backend/settings.py`           | Django settings              |
| `{BE_URLS}`           | `backend/backend/urls.py`               | Root URL config              |
| `{BRAIN_DIR}`         | `knowledge_brain/`                      | Module brain storage         |
| `{BUG_REPORT_DIR}`    | `bug_report_AI/`                        | Bug reports & audit data     |
| `{WORKFLOW_DIR}`      | `.agent/workflows/`                     | Workflow definitions         |

## Module Registry

> Each module has a Django app (backend) and a React page/component folder (frontend).

| Module           | Prefix | Django App                 | FE Page Dir              | FE Component Dir             | API URL Prefix       | Status    |
| ---------------- | ------ | -------------------------- | ------------------------ | ---------------------------- | -------------------- | --------- |
| Masters/Tickets  | MST    | `masters`                  | `pages/masters/`         | `components/tickets/`        | `/api/masters/`      | Active    |
| Feeds            | FED    | `feeds`                    | `pages/feeds/`           | `components/feeds/`          | `/api/feeds/`        | Active    |
| Project Mgmt     | PM     | `pm`                       | `pages/pm/`              | `components/pm/`             | `/api/pm/`           | Active    |
| Forms            | FRM    | `forms`                    | `pages/Forms/`           | `components/form/`           | `/api/forms/`        | Active    |
| HR               | HR     | `hr`                       | `pages/hr/`              | `components/hr/`             | `/api/hr/`           | Active    |
| Tags             | TAG    | `tags`                     | `pages/tags/`            | —                            | `/api/tags/`         | Active    |
| Reporting        | RPT    | `reporting`                | `pages/reporting/`       | `components/reporting/`      | `/api/reporting/`    | Active    |
| Gamification     | GAM    | `gamification`             | `pages/gamification/`    | `components/gamification/`   | `/api/gamification/` | Active    |
| GitHub           | GH     | `github`                   | `pages/github/`          | —                            | `/api/github/`       | Active    |
| Dashboard        | DSH    | `dashboard`                | `pages/Dashboard/`       | `components/analytics/`      | `/api/dashboard/`    | Active    |
| Common           | COM    | `common`                   | —                        | `components/common/`         | `/api/common/`       | Active    |
| Auth             | AUTH   | `modern_auth_notifications`| `pages/auth/`            | `components/auth/`           | `/api/modern-auth/`  | Active    |
| Reminders        | REM    | `reminders`                | `pages/reminders/`       | `components/ui/`             | `/api/reminders/`    | Active    |
| Client           | CLT    | `masters` (client views)   | `pages/client/`          | `components/client/`         | `/api/client-feeds/` | Active    |
| Admin            | ADM    | *(multiple)*               | `pages/admin/`           | —                            | `/api/common/`       | Active    |
| Settings         | SET    | `common`                   | `pages/Settings/`        | —                            | `/api/common/`       | Active    |

## Agent Behavioral Rules

| Rule ID   | Rule                                                                                       |
| --------- | ------------------------------------------------------------------------------------------ |
| AGENT-001 | Never modify database tables directly — always show migration SQL/code first               |
| AGENT-002 | Never delete code — comment with bug ID                                                    |
| AGENT-003 | Never change Django framework core or `node_modules/`                                      |
| AGENT-004 | When editing shared components, test ALL pages that use them                                |
| AGENT-005 | Never test against production URLs — always use `{LOCALHOST_FE}` / `{LOCALHOST_BE}`        |
| AGENT-006 | Never skip a workflow step silently — state what, why, and impact                          |
| AGENT-007 | If `.agent/.env` is missing or wrong, run `/validate-workflows` Pre-Flight first           |
| AGENT-008 | Always run `python manage.py makemigrations --dry-run` before actual migrations             |
| AGENT-009 | Never modify `axiosConfig.ts` or `AuthContext.tsx` without explicit approval               |
| AGENT-010 | TypeScript: Never use `any` — use proper types from `{FE_TYPES}`                           |

> **First time on a new machine?** Run `/validate-workflows` — the Pre-Flight auto-detects all local settings.
