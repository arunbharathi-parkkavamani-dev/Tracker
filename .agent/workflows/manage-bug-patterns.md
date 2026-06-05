---
description: Initialize or update the common bug patterns library for React + Node.js/Express stack
version: 1.0
last_updated: 2026-06-01
tech_stack: React + Vite (Frontend) / Node.js + Express + Mongoose (Backend)
---

# Manage Bug Patterns Workflow

## Purpose
Initialize or update the pattern library with React + Node.js/Express specific bug patterns.

## Seed Patterns (React + Vite + Node.js/Express)

### Backend (Node.js/Express + Express)

| ID | Pattern | Detection | Fix Template |
|---|---|---|---|
| PAT-SEC-001 | Missing permission class on ViewSet | `grep -rn "class.*ViewSet" --include="populateHelper.js"` then check for `permission_classes` | Add `permission_classes = [IsAuthenticated]` |
| PAT-SEC-002 | Raw SQL in ORM context | `grep -rn "raw\|extra\|RawSQL" --include="*.py"` | Rewrite using Mongoose |
| PAT-QRY-001 | N+1 query (missing select_related) | `grep -rn "\.objects\." --include="populateHelper.js"` without `select_related` | Add `select_related`/`prefetch_related` |
| PAT-QRY-002 | Missing pagination on list views | Check ViewSets missing `pagination_class` | Add `pagination_class` |
| PAT-VAL-001 | No serializer validation | `request.data` used directly without serializer | Route through serializer |
| PAT-TXN-001 | Missing transaction wrapper | Multi-model writes without `@transaction.atomic` | Wrap in `transaction.atomic()` |
| PAT-DEL-001 | Hard delete without cascade check | `Model.objects.delete()` without checking related | Add soft-delete or cascade cleanup |
| PAT-FLT-001 | Missing is_deleted filter | `Model.objects.all()` without `is_deleted=False` | Add filter or custom manager |
| PAT-ERR-001 | Bare except clause | `except:` or `except Exception` without logging | Add specific exception + logging |

### Frontend (React + TypeScript)

| ID | Pattern | Detection | Fix Template |
|---|---|---|---|
| PAT-TSX-001 | Missing error handling in API call | `axios.` without `.catch` or try/catch | Add error handling + toast |
| PAT-TSX-002 | Using `any` type | `grep -rn ": any" --include="*.tsx"` | Define proper TypeScript interface |
| PAT-TSX-003 | Missing React Query invalidation | `useMutation` without `onSuccess` invalidation | Add `queryClient.invalidateQueries` |
| PAT-TSX-004 | Stale closure in useEffect | State variable in dependency-less useEffect | Add deps or use useCallback |
| PAT-TSX-005 | Missing loading/error states | Component with useQuery but no isLoading/isError checks | Add loading spinner + error UI |
| PAT-TSX-006 | Direct DOM manipulation | `document.getElementById` in React | Use refs or state |
| PAT-TSX-007 | Missing key prop in list | `.map()` without `key` prop | Add unique `key` prop |
| PAT-TSX-008 | useEffect cleanup missing | Subscriptions/timers without cleanup return | Add cleanup function |

## Output
`bug_report_AI/COMMON_BUG_PATTERNS.md`
