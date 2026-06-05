---
description: Test and verify a bug fix with category-specific test requirements and module smoke tests
version: 1.0
last_updated: 2026-06-01
tech_stack: React + Vite (Frontend) / Node.js + Express + Mongoose (Backend)
---

# Test & Verify Workflow

## Purpose

Standardize testing after every bug fix. Every fix must pass prerequisite checks, syntax checks, automated tests, and a smoke test before approval.

## Prerequisites

- A bug fix has been applied (code change is in place)
- Bug ID, category, and severity are known

## Environment Config

| Variable          | Source                        | Change Per Project         |
| ----------------- | ----------------------------- | -------------------------- |
| `{PYTHON_PATH}`   | `.agent/.env` (auto-detected) | Auto-detected              |
| `{NODE_PATH}`     | `.agent/.env` (auto-detected) | Auto-detected              |
| `{MANAGE_PY}`     | `backend/manage.py`           | Node.js/Express management commands |
| `{PYTEST_PATH}`   | `pytest`                      | Test runner                |

## Steps

### Step 0: Prerequisite Check [Antigravity]

#### Step 0a: Python CLI Check
```powershell
python --version
```
- ✅ Output shows `Python 3.x` → continue
- ❌ Not found → auto-detect or ask user

#### Step 0b: Node.js Check
```powershell
node --version
npm --version
```
- ✅ Versions displayed → continue
- ❌ Not found → ask user

#### Step 0c: Node.js/Express System Check
```powershell
cd "{PROJECT_ROOT}\{BE_ROOT}" && python manage.py check
```
- ✅ No issues → continue
- ❌ Issues found → fix first

### Step 1: Syntax Check [Antigravity]

For **every** Python file changed:
```powershell
python -m py_compile {affected_python_file}
```

For **every** TypeScript file changed:
```powershell
cd "{PROJECT_ROOT}\{FE_ROOT}" && npx tsc --noEmit
```

For Node.js/Express migrations (if model changed):
```powershell
cd "{PROJECT_ROOT}\{BE_ROOT}" && Mongoose schema updates --check --dry-run
```

### Step 1.5: Select Test Approach [Antigravity — MANDATORY]

| Bug Type                    | Test Approach                        | Tool                |
| --------------------------- | ------------------------------------ | ------------------- |
| **API data mismatch**       | Node.js/Express test + Express APIClient          | pytest              |
| **Serializer validation**   | Unit test serializer                 | pytest              |
| **React component bug**     | Browser test on localhost            | Manual / Playwright |
| **Pure logic / calculation**| pytest unit test                     | pytest              |
| **ORM query bug**           | Node.js/Express test with test DB             | pytest              |
| **UI / interaction bug**    | Browser test on localhost            | Manual              |
| **TypeScript type error**   | TSC compilation check                | tsc --noEmit        |
| **API integration bug**     | Express APIClient test                   | pytest              |
| **WebSocket bug**           | Node.js/Express Channels test                 | pytest              |

### Step 2: Identify Required Tests by Category [Antigravity]

| Category                     | Required Tests                                                          |
| ---------------------------- | ----------------------------------------------------------------------- |
| **Security** (Auth, XSS)     | Permission enforcement, auth bypass blocked, CSRF validation            |
| **API / Serializer**         | Valid input passes, invalid input rejected, proper status codes          |
| **Logic / Calculation**      | Correct result normal input, edge cases (0, negative, max)              |
| **Data Validation**          | Valid accepted, invalid blocked, boundary conditions, null handling      |
| **Schema / Migration**       | Data preservation post-migration, type correctness                      |
| **React Component**          | Renders correctly, handles errors, responsive                           |
| **WebSocket / Real-time**    | Connection established, messages delivered, reconnection works           |

### Step 3: Check for Existing Tests [Antigravity]

```powershell
# Find existing tests for the module
Get-ChildItem "{PROJECT_ROOT}\{BE_ROOT}" -Recurse -Include "test_*.py", "*_test.py" | Select-String -Pattern "{MODULE_NAME}" -List
```

If found → run existing tests first:
```powershell
cd "{PROJECT_ROOT}\{BE_ROOT}" && python -m pytest {test_file} -v
```

### Step 4: Create New Tests (if P0/P1) [Antigravity]

For Node.js/Express backend tests:
```python
import pytest
from rest_framework.test import APIClient
from django.test import TestCase

class {ModuleName}{BugCategory}Test(TestCase):
    """
    Bug {BUG_ID}: {Title}
    Category: {Category}
    """
    def setUp(self):
        self.client = APIClient()
        # Setup test data

    def test_{bug_id}_fix_correct_behavior(self):
        """Tests that the fix resolves the issue"""
        # Arrange
        # Act
        # Assert

    def test_{bug_id}_edge_case(self):
        """Tests edge cases"""
        pass
```

### Step 5: Run All Tests [Antigravity]

```powershell
# Backend tests
cd "{PROJECT_ROOT}\{BE_ROOT}" && python -m pytest {test_file} -v

# Frontend type check
cd "{PROJECT_ROOT}\{FE_ROOT}" && npx tsc --noEmit

# Node.js/Express system check
cd "{PROJECT_ROOT}\{BE_ROOT}" && python manage.py check
```

### Step 6: Module Smoke Test Checklist [Human + Antigravity]

- [ ] Primary **create/save** action works
- [ ] Primary **edit/update** preserves ALL existing data
- [ ] Primary **delete** cleans up ALL related records
- [ ] **Search/filter** returns correct results
- [ ] **API endpoints** return proper status codes and data
- [ ] **Error cases** show appropriate messages to user
- [ ] **Browser console** shows no JS errors

**Module-specific additions:**

| Module          | Extra Smoke Tests                                                     |
| --------------- | --------------------------------------------------------------------- |
| Masters/Tickets | Ticket CRUD, comment/reply flow, file attachments, status transitions |
| Feeds           | Post creation, mentions, file uploads, notification triggers          |
| PM              | Task CRUD, Kanban board, iteration management, status sync with CIM   |
| HR              | Attendance, leave management, holiday calendar                        |
| Dashboard       | Widget rendering, data accuracy, responsive layout                    |
| Auth            | Login/logout, token refresh, session management, FCM tokens           |
| Reminders       | Create reminder, notification delivery, time parsing                  |

### Step 7: Sign-Off Criteria [Antigravity]

| Criterion                                          | Status |
| -------------------------------------------------- | ------ |
| Prerequisites verified (Python + Node + Node.js/Express)    |        |
| Syntax check passes (all changed files)            |        |
| TypeScript compilation clean                       |        |
| Node.js/Express system check passes                         |        |
| Automated tests pass                               |        |
| Smoke test items checked                           |        |
| No unintended side effects                         |        |
| Rollback plan documented                           |        |

## Completion Report

```
✅ Testing complete for {BUG_ID}
   Prerequisites: Python {version} ✅ | Node {version} ✅ | Node.js/Express check ✅
   Syntax: {N} files checked — all pass
   TypeScript: ✅ clean compilation
   Tests: {N} tests — all pass
   Smoke: {N}/{TOTAL} items checked
   Sign-off: {Ready / Blocked on: {reason}}

   Next: Approval gate in /fix-single-bug Step 7
```
