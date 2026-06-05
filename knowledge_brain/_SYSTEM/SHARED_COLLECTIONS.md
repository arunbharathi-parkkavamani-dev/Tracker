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
