---
description: Build or update the cross-module System Brain (_SYSTEM/) for shared tables and dependencies
version: 2.0
last_updated: 2026-06-03
tech_stack: React + Vite (Frontend) / Node.js + Express + Mongoose (Backend)
---

# Build System Brain Workflow

> **Purpose**: Aggregate data from all module brains into a cross-module knowledge layer.
> **Prereq**: Minimum 3 module brains built via `/build-module-brain`.

## Output

```
knowledge_brain/_SYSTEM/
├── SHARED_COLLECTIONS.md     ← MongoDB collections used by 2+ modules
├── MODULE_DEPENDENCIES.md    ← Which modules/frontend components depend on each other
├── SHARED_SCHEMAS.md         ← Shared Mongoose schemas and nested refs — who populates what
├── CROSS_MODULE_BUGS.md      ← Bugs spanning multiple modules
├── SYSTEM_COVERAGE.md        ← Coverage: how many modules have brains
├── DATA_FLOW_CHAINS.md       ← End-to-end business flows via populate API
├── VALIDATION_GAPS.md        ← Missing server-side payload/Mongoose validations
├── CLEANUP_GAPS.md           ← Missing cascades on document delete (Mongoose pre/post hooks)
├── PERFORMANCE_RISKS.md      ← Missing indexes, unoptimized aggregations, unbounded limits
├── DIAGNOSTIC_PLAYBOOK.md    ← Symptom→suspect rules (e.g. populateHelper trace)
├── DANGER_ZONES.md           ← NEVER rules (hard stops, e.g. bypassing role checks)
└── HANDOFF_AUDIT.md          ← Cross-module contract verification
```

## Steps

### Step 0: Pre-Check
Count module brains. If < 3 → STOP.

### Step 1-3: Read all module brain files
Read CROSS_MODULE_MAP.md, METHOD_INDEX.md, SCHEMA_ANALYSIS.md from each module.

### Step 4-8: Generate system brain documents
Build each `_SYSTEM/` document from aggregated data. Ensure that you track MongoDB `ref` paths and frontend generic API payload structures rather than legacy Django constraints.

### Step 8b: Generate HANDOFF_AUDIT.md
Match outbound contracts (dynamic payloads) from each module against inbound constraints/schemas of downstream logic.

## Completion Report

```
✅ System Brain — {MODE} complete
   Modules scanned: {N}
   Shared collections: {N} ({N} high-risk)
   Dependencies: {N} links
   Coverage: {N}/{TOTAL} modules ({N}%)
```
