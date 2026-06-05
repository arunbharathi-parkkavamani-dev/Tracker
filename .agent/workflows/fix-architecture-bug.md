---
description: Fix Track A (system/architecture) bugs — AI-led with human approval
version: 1.0
last_updated: 2026-06-01
tech_stack: React + Vite (Frontend) / Node.js + Express + Mongoose (Backend)
---

# Fix Architecture Bug Workflow

## Purpose

Fix system/architecture bugs (Track A) — security, query, schema, exception, performance. AI leads the fix, human approves the diff.

## Track A Bug Categories

| Category | Examples | AI Confidence |
|---|---|---|
| **Security** | Auth bypass, XSS, CSRF, permission gaps | 🟢 Pattern-based |
| **Query/ORM** | N+1 queries, wrong filters, missing indexes | 🟢 Structural |
| **Schema** | Missing columns, wrong types, migration issues | 🟡 Needs DB context |
| **Exception** | Unhandled errors, missing try-catch | 🟢 Pattern-based |
| **Performance** | Slow queries, large payloads, missing pagination | 🟡 Needs profiling |
| **AJAX/API** | Wrong status codes, missing error responses | 🟢 Pattern-based |

## Steps

### Step 1: Load Bug Context
Read from execution plan + Module Brain + System Brain.

### Step 2: Category-Specific Investigation

**For Query/ORM bugs:**
1. Read the Mongoose query
2. Check for `select_related` / `prefetch_related`
3. Use Node.js/Express Debug Toolbar or `EXPLAIN` to analyze
4. Propose optimized query

**For Security bugs:**
1. Check Express permission classes
2. Verify authentication requirements
3. Check for object-level permissions
4. Verify input sanitization in serializers

**For Schema bugs:**
1. Read current model definition
2. Generate migration with `--dry-run`
3. Verify existing data compatibility
4. Propose ALTER with rollback

### Step 3: Apply Fix (AI-led)
Apply minimal fix following `/fix-single-bug` Step 4.

### Step 4: Present Diff for Approval
Show before/after code to human. Human approves or rejects.

## Completion
Route back to `/fix-single-bug` Step 7 (Approval Gate).
