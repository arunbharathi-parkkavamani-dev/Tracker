# Developer Guide — CIM Agent System

## Overview

This `.agent/` directory contains the AI-assisted bug remediation and development system for the **Customer Integrated Management (CIM)** project. It is built for the **React + Vite + Django** tech stack.

## Tech Stack

| Layer     | Technology                                    |
| --------- | --------------------------------------------- |
| Frontend  | React 18 + TypeScript + Vite                  |
| Backend   | Django 5.0 + Django REST Framework            |
| Database  | MySQL 8 (utf8mb4)                             |
| Auth      | Token Auth (modern_auth_notifications)        |
| WebSocket | Django Channels + Daphne                      |
| Cache     | Redis (prod/staging) / LocMem (dev)           |
| Queue     | Celery + Redis                                |

## Quick Start

1. **First time?** Run `/validate-workflows` to auto-detect your environment
2. **Build a brain**: `/build-module-brain {MODULE_NAME}`
3. **Audit a module**: `/module-bug-audit {MODULE_NAME}`
4. **Fix a bug**: `/fix-single-bug {BUG_ID}`

## Directory Structure

```
.agent/
├── GEMINI.md              ← Project rules (read first in every conversation)
├── config.md              ← Central config (paths, module registry, variables)
├── DEVELOPER_GUIDE.md     ← This file
├── .env.example           ← Environment template (copy to .env)
├── .env                   ← Local environment values (gitignored)
├── workflows/             ← All 19 workflow definitions
│   ├── 00-INDEX.md        ← Workflow index
│   ├── build-module-brain.md
│   ├── fix-single-bug.md
│   ├── test-and-verify.md
│   ├── bug-intake-triage.md
│   └── ... (15 more)
└── skills/                ← Reusable skill modules
    ├── bug-fix-engine/
    └── requirement-generator/
```

## Key Workflows

| Command | Purpose |
|---|---|
| `/build-module-brain` | Build knowledge base for a Django app + React module |
| `/fix-single-bug` | Fix ONE bug with full traceability |
| `/test-and-verify` | Run Python/TypeScript checks + tests |
| `/bug-intake-triage` | Classify and prioritize a new bug |
| `/get-requirement` | Generate structured requirement from task description |
| `/validate-workflows` | Auto-setup environment + self-test |

## Module Registry

See `config.md` for the full module registry mapping Django apps to React pages/components.

## Adapted From

This system was adapted from a PHP/CodeIgniter 3 agent system to work with the React + Vite + Django tech stack. Key adaptations:

| Original (PHP/CI3)                | Adapted (React + Django)                  |
| --------------------------------- | ----------------------------------------- |
| `php -l` syntax check             | `python -m py_compile` + `tsc --noEmit`   |
| PHPUnit tests                     | pytest + DRF APIClient tests              |
| CI3 Controller methods            | DRF ViewSets / APIViews                   |
| CI3 Model methods                 | Django Models + ORM                       |
| jQuery AJAX calls                 | React + axios + React Query               |
| CI3 Views (PHP templates)         | React components (.tsx)                   |
| `$this->db->` query builder       | Django ORM (QuerySet API)                 |
| `$_POST` / `$this->input->post()` | DRF `request.data` + Serializers          |
| JavaScript (jQuery)               | TypeScript (React hooks)                  |
| `LOCALHOST_URL` (single)           | `LOCALHOST_FE` + `LOCALHOST_BE` (split)   |
