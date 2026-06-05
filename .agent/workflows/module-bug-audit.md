---
description: Find all bugs in a module through systematic 6-round audit
version: 1.0
last_updated: 2026-06-01
tech_stack: React + Vite (Frontend) / Node.js + Express + Mongoose (Backend)
---

# Module Bug Audit Workflow

## Purpose
Systematically find all bugs in a module through 6 rounds of increasingly deep analysis.

## Prerequisites
- Module Brain built via `/build-module-brain` (coverage ≥ 80%)

## Audit Rounds

### Round 1: Security Scan
- [ ] Express permission classes on all views
- [ ] Object-level permissions where needed
- [ ] Input validation in serializers (no raw `request.data` usage)
- [ ] CSRF protection on state-changing endpoints
- [ ] File upload validation (type, size, extension)
- [ ] XSS vectors (dangerouslySetInnerHTML in React)

### Round 2: Data Integrity
- [ ] ORM query correctness (filters, joins, aggregations)
- [ ] Soft-delete filter consistency (`is_deleted=False`)
- [ ] Foreign key integrity (orphan record risks)
- [ ] Transaction wrapping for multi-table writes
- [ ] Serializer validation completeness

### Round 3: Error Handling
- [ ] API error responses (proper status codes)
- [ ] React error boundaries
- [ ] axios interceptor error handling
- [ ] Missing try/except in views
- [ ] Unhandled promise rejections in React

### Round 4: Performance
- [ ] N+1 query detection (missing select_related/prefetch_related)
- [ ] Missing pagination on list endpoints
- [ ] Large queryset loading (no `.all()` without limits)
- [ ] Missing database indexes
- [ ] React re-render optimization (useMemo, useCallback)

### Round 5: Business Logic
- [ ] Calculation accuracy
- [ ] Business rule enforcement (both frontend and backend)
- [ ] Status transition validity
- [ ] Cross-module data consistency
- [ ] Edge cases (empty lists, null values, boundary conditions)

### Round 6: Integration
- [ ] API contract consistency (frontend expects ↔ backend returns)
- [ ] WebSocket message handling
- [ ] File upload/download flow
- [ ] Cross-module API calls
- [ ] React Query cache invalidation correctness

## Output
- `bug_report_AI/{module}/CONSOLIDATED_BUG_REPORT.md`
- `bug_report_AI/{module}/{MODULE}_EXECUTION_PLAN.md`
- GitHub Issues created via `/bug-intake-triage`
