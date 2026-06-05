# Core Module Brain

## Overview
This module contains 13 models, 10 services, and 5 frontend files.

## Backend Models
| Model | File | Lines | References |
|---|---|---|---|
| AccessPolicies | AccessPolicies.js | 39 | roles |
| Role | Role.js | 30 | capabilities[] — dynamic permission strings |
| AgentToken | AgentToken.js | 27 | Client |
| ApiHitLog | ApiHitLog.js | 25 | employees |
| AuditLog | AuditLog.js | 24 |  |
| Collection | Collection.js | 73 |  |
| EmailConfig | EmailConfig.js | 63 |  |
| ErrorLog | ErrorLog.js | 12 | employees |
| Expense | Expense.js | 53 | employees, clients |
| HRPolicy | HRPolicy.js | 53 | Department, Role, Employee |
| notification | notification.js | 36 | employees |
| Payroll | Payroll.js | 39 | Employee |
| Session | Session.js | 67 | employees |
| SideBar | SideBar.js | 52 | departments, designations, sidebars |

## Backend Services (Business Logic Hooks)
| Service File | Lines | Exported Functions |
|---|---|---|
| agent.js | 1 |  |
| asyncNotificationService.js | 311 |  |
| attendanceService.js | 203 |  |
| computationService.js | 440 |  |
| databaseIndexer.js | 276 |  |
| jobQueue.js | 89 |  |
| queryOptimizer.js | 298 |  |
| raceConditionHandler.js | 475 |  |
| requestQueue.js | 363 |  |
| sidebars.js | 148 |  |

## Role Capability System

Hardcoded role-name string arrays in services are **banned**. Use `canDo(roleId, capability)` from `utils/cache.js`.

| Utility | File | Usage |
|---|---|---|
| `canDo(roleId, cap)` | `utils/cache.js` | Zero DB calls — checks `Role.capabilities[]` from in-memory cache |

### Defined capabilities
| Capability | Used in service | Meaning |
|---|---|---|
| `manage:salarystructures` | `salarystructures.js` | Create/update salary structures |
| `manage:payroll` | `payrolls.js`, `payrollruns.js` | Run payroll, approve, mark paid |
| `manage:employees` | — | Create/update employee records |
| `manage:expenses` | `expenses.js` | Approve/reject expense submissions |
| `manage:agents` | `agents.js` | Create agents |
| `manage:leaves` | — | Approve/reject leave requests |
| `manage:attendance` | — | Correct attendance records |
| `view:reports` | — | Access HR reports & analytics |

To assign capabilities to roles run: `node src/scripts/seedRoleCapabilities.js`
To add a new guarded action: use `canDo(role, 'new:capability')` in the service, add the capability string to the seed map and to `ALL_CAPABILITIES` in `frontend/src/pages/Master-Data/Roles/form.jsx` — no other changes needed.

## Dynamic API Usage
| File | Method | URL | Target Model |
|---|---|---|---|
| Teams.jsx | POST | /populate/read/employees | employees |
| useGenericAPI.js | POST | /populate/create/${model} | ${model} |
| useGenericAPI.js | PUT | /populate/update/${model}/${id} | ${model} |
| useGenericAPI.js | DELETE | /populate/delete/${model}/${id} | ${model} |
| useGenericAPI.js | POST | /populate/bulk-create/${model} | ${model} |
| useGenericAPI.js | PUT | /populate/bulk-update/${model} | ${model} |
| useGenericAPI.js | DELETE | /populate/bulk-delete/${model} | ${model} |
