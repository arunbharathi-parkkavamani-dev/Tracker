---
description: Fix a single bug end-to-end using the 8-step workflow with layer-specific procedures
version: 1.0
last_updated: 2026-06-01
tech_stack: React + Vite (Frontend) / Node.js + Express + Mongoose (Backend)
---

# Fix Single Bug Workflow

## Purpose

Fix ONE bug at a time with surgical precision, full traceability, and documented rollback. This is the **Fix Execution** phase — `/bug-intake-triage` prepares the bug, this workflow fixes it.

## Core Principles

> **ONE bug at a time. No batch fixes. Stability > Elegance. Documentation first.**

1. **Isolation** — Each bug fixed in its own change, linked to a specific Bug ID
2. **Traceability** — Every change references the Bug ID in commit messages and docs
3. **Reversibility** — Every fix has a documented rollback plan BEFORE the fix is applied
4. **Surgical precision** — Minimal fix footprint, no opportunistic refactoring
5. **Pattern reuse** — Check `COMMON_BUG_PATTERNS.md` BEFORE writing a fix from scratch

## Prerequisites

- Bug ID is known (e.g., `MST-R301`, `FED-S02`)
- Bug has been triaged via `/bug-intake-triage`
- Execution plan exists: `bug_report_AI/{module}/`
- `bug_report_AI/COMMON_BUG_PATTERNS.md` exists and is loaded
- Module Brain preferred: `knowledge_brain/{MODULE_NAME}/MODULE_BRAIN.md`

## Steps

### Step 0: DUPLICATE FIX GUARD [Antigravity]

1. Read the bug entry from the execution plan
2. Check the bug's status:
   - **`✅ Fixed`** → WARN: "Bug {BUG_ID} was already fixed. Re-open or skip?"
   - **`🔧 In Progress`** → WARN: "Bug {BUG_ID} is being worked on. Continue?"
   - **`⏳ Queue` / blank** → Proceed normally

### Step 0b: REGISTER IN ACTIVE BUG TRACKER [Antigravity]

1. Read `.agent/config.md` for project variables
2. Open `bug_report_AI/ACTIVE_BUGS.md`
3. Add row to **In-Progress Bugs** table

### Step 1: DIAGNOSE [Antigravity]

1. Read the bug entry from the execution plan. Extract:
   - Problem summary, root cause, impact, affected file(s), proposed fix, risk level, rollback plan

2. **Pattern check** — search `bug_report_AI/COMMON_BUG_PATTERNS.md`:
   - **Match found**: Note Pattern ID → use fix template
   - **No match**: Novel bug → use execution plan's proposed fix

3. If Module Brain exists, cross-reference:
   - Which business rule is violated? (check `BUSINESS_RULES.md`)
   - Which data flow path is affected? (check `DATA_FLOW.md`)
   - Any cross-module dependencies? (check `CROSS_MODULE_MAP.md`)
   - Which tables are touched? (check `METHOD_INDEX.md` reverse map)

4. **System Brain cross-reference** — if `knowledge_brain/_SYSTEM/` exists:
   - Does the fix touch a shared table? → check `_SYSTEM/SHARED_TABLES.md`
   - Is there a known cleanup gap? → check `_SYSTEM/CLEANUP_GAPS.md`
   - Any known validation gap? → check `_SYSTEM/VALIDATION_GAPS.md`

### Step 1b: CONFIDENCE GATE [Mandatory]

Rate your confidence:

🟢 **HIGH (80%+)**: Pattern match found, brain has full coverage.
   → Proceed to Step 2

🟡 **MEDIUM (50-80%)**: Brain covers the area but root cause is ambiguous.
   → Present TOP 3 possible causes to developer WITH evidence
   → Developer chooses which to investigate

🔴 **LOW (<50%)**: Novel bug, no pattern match, unfamiliar subsystem.
   → STOP. Present what you know and don't know. Ask for guidance.

**⛔ Automatic LOW confidence** if the bug involves:
- Payment / financial data discrepancy
- WebSocket / real-time sync failure
- Cross-module data flow (3+ modules)
- Authentication / authorization edge cases
- Database migration or schema changes
- Celery task failures

### Step 2: LOCATE [Antigravity]

1. Open the affected file(s) at the specified line number(s)
2. Read current code verbatim
3. Confirm the code matches the execution plan
4. If the code has changed since audit — does the bug still exist?
5. Layer-by-layer trace: `React Component → axios → API Route → Serializer → Model → DB`

### Step 3: ASSESS [Antigravity]

1. **Track classification**:
   - **Track A (System)**: Security, query, schema, exception, performance → AI fixes, human approves diff
   - **Track B (Business)**: Calculation, business rule, workflow, integration → AI proposes, human validates logic
2. **Risk level**: Low / Medium / High
3. **Cross-module impact**: Check `CROSS_MODULE_MAP.md`
4. If cross-module impact detected → **alert user before proceeding**

### Step 4: PLAN & APPLY FIX [Antigravity]

**Before applying any fix, document the rollback plan.**

#### 4a. Append to Rollback Registry

After applying the fix, add entry to `bug_report_AI/ROLLBACK_REGISTRY.md`.

#### 4b. RIPPLE CHECK [Mandatory]

**For Mongoose Schema fixes:**
- [ ] Serializer validation correct?
- [ ] All views using this serializer still work?
- [ ] Frontend components consuming this API still render correctly?
- [ ] List, detail, create, update endpoints all tested?

**For React Component fixes:**
- [ ] Component renders correctly in all usage contexts?
- [ ] Props interface still compatible with all parent components?
- [ ] React Query cache invalidation working?
- [ ] Error states handled?

**For Node.js/Express Model fixes:**
- [ ] Migration generated and reviewed?
- [ ] All serializers referencing this model updated?
- [ ] All queries/filters still work with schema change?
- [ ] Existing data preserved?

**For API Endpoint fixes:**
- [ ] URL pattern unchanged (or frontend updated)?
- [ ] Request/response format unchanged (or frontend updated)?
- [ ] Authentication/permissions correct?
- [ ] Pagination still works?

#### For Node.js/Express Backend Fixes:

1. Locate exact file and line from execution plan
2. Read current code — confirm it matches
3. Apply the **minimal** fix
4. Run: `python manage.py check` to verify no system errors
5. If model changed: `Mongoose schema updates --dry-run` to preview

#### For React Frontend Fixes:

1. Locate exact component and line
2. Verify fix doesn't affect other components that share the same props/context
3. Apply minimal fix — prefer patterns already proven in the same codebase
4. Verify TypeScript compilation: check for type errors
5. Flag for manual testing: "Clear browser cache and test"

### Step 5: SYNTAX CHECK [Antigravity]

1. For Python files:
```powershell
python -m py_compile {affected_python_file}
```

2. For TypeScript files:
```powershell
cd "{PROJECT_ROOT}\{FE_ROOT}" && npx tsc --noEmit
```

3. For Node.js/Express system check:
```powershell
cd "{PROJECT_ROOT}\{BE_ROOT}" && python manage.py check
```

4. If any check fails → fix → re-run

### Step 6: TEST [Antigravity]

1. **Backend tests** (if pytest/django tests exist):
```powershell
cd "{PROJECT_ROOT}\{BE_ROOT}" && python -m pytest {test_file} -v
```

2. **Frontend lint** (TypeScript):
```powershell
cd "{PROJECT_ROOT}\{FE_ROOT}" && npx tsc --noEmit
```

3. If no test exists and P0/P1 bug → create one
4. Present smoke test checklist:
   - [ ] Primary **create/save** action works
   - [ ] Primary **edit/update** preserves all data
   - [ ] Primary **delete** cleans up related records
   - [ ] **Search/filter** returns correct results
   - [ ] **API responses** match expected format
   - [ ] **Error cases** handled gracefully

### Step 7: APPROVAL GATE [Human]

```
Bug: {BUG_ID} — {Title}
Track: {A (System) / B (Business)}
Risk: {Low / Medium / High}
Pattern: {PAT-XXX / Novel}

Changed:
  {file}:{lines} — {1-line description}

Test Results:
  {N} tests, {M} assertions — all passed

Rollback:
  {1-line rollback instruction}

Approve? (yes / modify / reject)
```

### Step 8: CLOSE & UPDATE [Antigravity]

1. **Bug tracking**: Mark bug as ✅ Fixed with date
2. **Pattern library**: Update `COMMON_BUG_PATTERNS.md`
3. **Module Brain**: Add anti-pattern note to `MODULE_BRAIN.md`
4. **Walkthrough**: Generate fix documentation
5. **Communication**: Notify reporter

## Completion Report

```
✅ Bug {BUG_ID} — {TITLE}
   Track: {A/B}
   Fix: {1-line summary}
   File: {path}:{lines}
   Tests: {N} tests — all passed
   Risk: {Low/Medium/High}
   Pattern: {PAT-XXX matched / NEW pattern / N/A}
   Rollback: {1-line rollback instruction}
   Next bug: {NEXT_BUG_ID} — {NEXT_TITLE}
```
