# Tickets Module Brain

## Overview
This module contains 3 models, 3 services, and 3 frontend files.

## Backend Models
| Model | File | Lines | References |
|---|---|---|---|
| CommentsThreads | CommentsThreads.js | 46 | employees, tasks |
| Ticket | Ticket.js | 107 | projecttypes, Client, TaskType, employees, Department, tasks, milestones |
| Todo | Todo.js | 51 | employees |

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
