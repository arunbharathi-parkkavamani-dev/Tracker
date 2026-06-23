# Tickets Module Brain

## Overview
This module contains 3 models, 3 services, and 3 frontend files.

## Backend Models
| Model | File | Lines | Key Fields | Notes |
|---|---|---|---|---|
| CommentsThreads | CommentsThreads.js | 46 | — | Refs: employees, tasks |
| Ticket | Ticket.js | 107 | `status` (String, no enum), `metaStatus` (String, default: active) | Status dynamic via StatusConfig. `metaStatus` tracks record lifecycle. Refs: projecttypes, Client, TaskType, employees, Department, tasks, milestones |
| Todo | Todo.js | 51 | — | Refs: employees |

> **status field (as of 2026-06-10)**: No enum. Default: `"Open"`. Workflow options from `statusconfigs` (`modelName: 'tickets'`, `workflowStatuses`).
> **metaStatus field**: Default: `"active"`. Lifecycle options from `statusconfigs.metaStatuses`.

## Backend Services (Business Logic Hooks)
| Service File | Lines | Exported Functions |
|---|---|---|
| commentthreads.js | 80 |  |
| tickets.js | 178 |  |
| ticketTaskSync.js | 85 |  |

## Dynamic API Usage
| File | Method | URL | Target Model |
|---|---|---|---|
| index.jsx | POST | /populate/read/tickets | tickets |
| index.jsx | PUT | /populate/update/tickets/${ticket._id} | tickets |
| index.jsx | POST | /populate/create/tickets | tickets |
| index.jsx | PUT | /populate/update/tickets/${editingTicket._id} | tickets |
| my-tickets.jsx | POST | /populate/read/tickets | tickets |
| my-tickets.jsx | POST | /populate/create/tickets | tickets |
| my-tickets.jsx | PUT | /populate/update/tickets/${editingTicket._id} | tickets |
| reports.jsx | POST | /populate/report/tickets | tickets |
