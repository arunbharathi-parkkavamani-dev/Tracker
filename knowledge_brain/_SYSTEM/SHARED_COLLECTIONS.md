# System Module Dependencies

## Shared Collections (Inbound Refs)
| Target Model | Referenced By |
|---|---|
| roles | AccessPolicies, Employee, LeavePolicy |
| clients | Agent, DailyActivity, Expense, Tasks |
| departments | Agent, Employee, Leave, Regularization, SideBar |
| Client | AgentToken, Ticket |
| employees | ApiHitLog, Attendance, CommentsThreads, DailyActivity, Employee, ErrorLog, Expense, Leave, notifications, NotificationReceptionist, Regularization, Session, Tasks, Ticket, Todo |
| leavetypes | Attendance, Employee, Leave, LeavePolicy |
| Employee | Client, HRPolicy, Payroll, Shift |
| projecttypes | Client, DailyActivity, Tasks, Ticket |
| milestones | Client, Tasks, Ticket |
| tasks | CommentsThreads, Ticket |
| tasktypes | DailyActivity, Tasks |
| designations | Employee, SideBar |
| Department | HRPolicy, Ticket |
| notifications | NotificationReceptionist |
| sessions | FCMService |
| salarystructures | Payroll (salaryStructureId), payrollEngine.resolveStructure |
| payrollruns | Payroll (payrollRunId), payrollEngine.finalizeRun |
| holidays | payrollEngine.computeWorkingDays |
| attendances | payrollEngine.computeAttendanceSummary |
| leaves | payrollEngine.computeAttendanceSummary |
| **statusconfigs** | Tasks (workflowStatus lookup), Tickets, Expenses, Leaves, Regularizations, DailyActivities, HRPolicies — all workflow models use StatusConfig for dynamic status labels/colors |
| **statusmappings** | ticketTaskSync.js — reads task→ticket status mappings to auto-propagate status changes across linked records |

## Dynamic Status System (added 2026-06-10)

All workflow models now carry TWO status fields:

| Field | Purpose | Source of truth |
|---|---|---|
| `status` | Operational/workflow position (e.g. Pending, In Progress, Closed) | `statusconfigs.workflowStatuses` |
| `metaStatus` | Record lifecycle (active / inactive / draft / archive / deleted) | `statusconfigs.metaStatuses` |

### Models with both `status` + `metaStatus`
| Model | Collection | Default status | Default metaStatus |
|---|---|---|---|
| Tasks | tasks | Backlogs | active |
| Ticket | tickets | Open | active |
| Expense | expenses | pending | active |
| Leave | leaves | Pending | active |
| Regularization | regularizations | Pending | active |
| DailyActivity | dailyactivities | Pending | active |
| HRPolicy | hrpolicies | Draft | active |

### StatusConfig seed (run once per env)
```
node src/scripts/seedStatusConfigs.js
```
Seeds `statusconfigs` for all 7 models above. Safe to re-run (upsert).
