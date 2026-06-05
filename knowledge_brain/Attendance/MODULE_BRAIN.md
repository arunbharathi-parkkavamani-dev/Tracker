# Attendance Module Brain

## Overview
This module contains 7 models, 3 services, and 9 frontend files.

## Backend Models
| Model | File | Lines | References |
|---|---|---|---|
| Attendance | Attendance.js | 46 | employees, leavetypes |
| DailyActivity | DailyActivity.js | 26 | clients, projecttypes, employees, tasktypes |
| Leave | Leave.js | 33 | employees, departments, leavetypes |
| LeavePolicy | LeavePolicy.js | 21 | leavetypes, roles |
| LeaveTypes | LeaveTypes.js | 23 |  |
| Regularization | Regularization.js | 46 | employees, departments, attendances |
| Shift | Shift.js | 43 | Employee, Shift |

## Backend Services (Business Logic Hooks)
| Service File | Lines | Exported Functions |
|---|---|---|
| attendances.js | 141 |  |
| leaves.js | 155 |  |
| regularizations.js | 141 |  |

## Dynamic API Usage
| File | Method | URL | Target Model |
|---|---|---|---|
| [id].jsx | POST | /populate/read/dailyactivities/${id} | dailyactivities |
| add-daily-activity.jsx | POST | /populate/create/dailyactivities | dailyactivities |
| index.jsx | POST | /populate/read/dailyactivities | dailyactivities |
| index.jsx | GET | /populate/read/attendances?filter=${encodeURIComponent(filter)} | attendances?filter=${encodeURIComponent(filter)} |
| index.jsx | POST | /populate/create/attendances | attendances |
| index.jsx | PUT | /populate/update/attendances/${todayRec._id} | attendances |
| leave-regularization.jsx | POST | /populate/read/employees/${user.id} | employees |
| leave-regularization.jsx | POST | /populate/read/attendances | attendances |
| leave-regularization.jsx | POST | /populate/read/employees/${user.id} | employees |
| leave-regularization.jsx | POST | /populate/create/leaves | leaves |
| leave-regularization.jsx | POST | /populate/create/regularizations | regularizations |
| model.jsx | GET | /populate/read/leaves/${id} | leaves |
| pending-approvals.jsx | GET | /populate/read/leaves | leaves |
| pending-approvals.jsx | GET | /populate/read/regularizations | regularizations |
