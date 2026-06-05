---
description: Intake a new bug report, classify severity/track/category, assign sprint, and prepare for fix workflow
version: 1.0
last_updated: 2026-06-01
tech_stack: React + Vite (Frontend) / Node.js + Express + Mongoose (Backend)
---

# Bug Intake & Triage Workflow

## Purpose

Standardize how bugs enter the pipeline — from raw report to triaged, ID'd entry ready for `/fix-single-bug`.

## Prerequisites

- Bug has been reported (client ticket, internal QA, or AI audit)
- Module name is known
- `bug_report_AI/COMMON_BUG_PATTERNS.md` exists

## Steps

### Step 0: Environment Pre-Check [Antigravity]

1. **Python CLI**: Run `python --version`
2. **Config check**: Verify `.agent/config.md` `{PROJECT_ROOT}` matches current workspace

### Step 1: Collect Bug Report Fields

| Field                  | Required |
| ---------------------- | -------- |
| **Reporter**           | ✅       |
| **Module**             | ✅       |
| **Sub-Module**         | ✅       |
| **Steps to Reproduce** | ✅       |
| **Expected Behavior**  | ✅       |
| **Actual Behavior**    | ✅       |
| **Evidence**           | ✅       |
| **Environment**        | ✅       |
| **Frequency**          | ✅       |

### Step 2: Assign Severity

| Level             | Criteria                                                  | Target Fix Time   |
| ----------------- | --------------------------------------------------------- | ----------------- |
| **P0 — Critical** | Data loss, security breach, system down                   | Same day (Hotfix) |
| **P1 — Major**    | Wrong data display, broken business rules, orphan records | ≤ 3 days          |
| **P2 — Minor**    | UX issues, missing validations, edge cases                | Next sprint       |
| **P3 — Cosmetic** | Styling, debug artifacts, dead code                       | Backlog           |

### Step 3: Assign Track

| Track                             | When                                                                | AI Role          | Human Role              |
| --------------------------------- | ------------------------------------------------------------------- | ---------------- | ----------------------- |
| **Track A — System/Architecture** | Security, query, schema, exception, performance bugs                | Full fix + test  | Approve diff            |
| **Track B — Business**            | Calculation errors, missing rules, workflow bugs, integration       | Propose fix      | Validate business logic |

### Step 4: Assign Category

| #   | Category               | Signals                                                    |
| --- | ---------------------- | ---------------------------------------------------------- |
| 1   | **Logic**              | Wrong calculations, missing business rules                 |
| 2   | **Data Validation**    | No null/type checks, frontend-only validation              |
| 3   | **Database**           | ORM bugs, missing indexes, orphan records                  |
| 4   | **Exception Handling** | Missing try-catch, unhandled errors                        |
| 5   | **Security**           | Auth bypass, XSS, CSRF, missing permissions                |
| 6   | **Performance**        | N+1 queries, no pagination, heavy queries                  |
| 7   | **Integration**        | API error handling, cross-module data handshake, WebSocket |
| 8   | **TypeScript**         | Type errors, incorrect interfaces, runtime type mismatches |
| 9   | **React State**        | Stale state, race conditions, missing cache invalidation   |

### Step 5: Generate Bug ID

Format: `{PREFIX}-{SOURCE}{SEQ}`

| Module           | Prefix |
| ---------------- | ------ |
| Masters/Tickets  | MST    |
| Feeds            | FED    |
| PM               | PM     |
| HR               | HR     |
| Dashboard        | DSH    |
| Auth             | AUTH   |
| Reminders        | REM    |
| Gamification     | GAM    |
| Reporting        | RPT    |
| Tags             | TAG    |
| Forms            | FRM    |
| Common           | COM    |
| GitHub           | GH     |
| Client           | CLT    |

### Step 6: Quick Pattern Check

1. Read `bug_report_AI/COMMON_BUG_PATTERNS.md`
2. Match found → note Pattern ID
3. No match → novel bug

### Step 7: Assign Sprint

| Sprint   | Bugs Assigned                   |
| -------- | ------------------------------- |
| Sprint 1 | All P0 + critical P1            |
| Sprint 2 | Remaining P1 + high-priority P2 |
| Sprint 3 | Remaining P2 + all P3           |

### Step 8: Check Module Brain Readiness

1. Check if `knowledge_brain/{MODULE_NAME}/MODULE_BRAIN.md` exists
2. If **NO**: Flag → "Run `/build-module-brain` first."
3. If **YES**: Ready for `/fix-single-bug`

### Step 9: Create Bug Entry

File: `bug_report_AI/{module_name}/BUG_{BUG_ID}.md`

### Step 10: Send Acknowledgement

| Source              | SLA              |
| ------------------- | ---------------- |
| Client (production) | ≤ 2 hours        |
| Support (internal)  | ≤ 4 hours        |
| QA/Tester           | ≤ 1 business day |

## Completion Report

```
✅ Bug {BUG_ID} triaged
   Severity: P{N}
   Track: {A/B}
   Category: {Category}
   Sprint: {Sprint N}
   Pattern: {PAT-XXX / Novel}
   Brain: {Ready / Needs build}
   Next: /fix-single-bug {BUG_ID}
```
