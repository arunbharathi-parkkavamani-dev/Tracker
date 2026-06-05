# HR Module Brain

## Overview
This module contains 5 models, 3 services, and 0 frontend files.

## Backend Models
| Model | File | Lines | References |
|---|---|---|---|
| Agent | Agent.js | 40 | clients, departments |
| Department | Department.js | 26 | leavepolicies |
| Designation | Designation.js | 20 |  |
| Employee | Employee.js | 93 | designations, departments, roles, employees, leavetypes |
| Role | Role.js | 34 |  |

## Backend Services (Business Logic Hooks)
| Service File | Lines | Exported Functions |
|---|---|---|
| AgentInviteService.js | 115 |  |
| agents.js | 36 |  |
| employee.js | 26 |  |

## Dynamic API Usage
| File | Method | URL | Target Model |
|---|---|---|---|
