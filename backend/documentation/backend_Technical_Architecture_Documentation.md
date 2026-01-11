# Tracker Backend Technical Architecture Documentation

---

**Document Version**: 1.0  
**Generated**: 2026-01-11  
**Platform**: Tracker HR & Project Management System  
**Audience**: Developers, API Consumers, Technical Architects, Platform Engineers

---

## Table of Contents

1. [Module Overview](#1-module-overview)
2. [End-to-End System Flow](#2-end-to-end-system-flow)
3. [Sub-Module Technical Documentation](#3-sub-module-technical-documentation)
   - 3.1 [Authentication Sub-Module](#31-authentication-sub-module)
   - 3.2 [Employee Management Sub-Module](#32-employee-management-sub-module)
   - 3.3 [Attendance & Time Tracking Sub-Module](#33-attendance--time-tracking-sub-module)
   - 3.4 [Leave Management Sub-Module](#34-leave-management-sub-module)
   - 3.5 [Regularization Sub-Module](#35-regularization-sub-module)
   - 3.6 [Task Management Sub-Module](#36-task-management-sub-module)
   - 3.7 [Ticket Management Sub-Module](#37-ticket-management-sub-module)
   - 3.8 [Client Management Sub-Module](#38-client-management-sub-module)
   - 3.9 [Daily Activity Sub-Module](#39-daily-activity-sub-module)
   - 3.10 [Payroll Sub-Module](#310-payroll-sub-module)
   - 3.11 [Notification Sub-Module](#311-notification-sub-module)
   - 3.12 [Access Control (ABAC) Sub-Module](#312-access-control-abac-sub-module)
4. [Inter Sub-Module Dependency Flow](#4-inter-sub-module-dependency-flow)
5. [Workflow Diagrams](#5-workflow-diagrams)
6. [Common System Scenarios](#6-common-system-scenarios)
7. [Operational Notes](#7-operational-notes)

---

## 1. Module Overview

### 1.1 Technical Purpose

The **Tracker** backend is a hybrid monolithic API server designed for enterprise HR management and project tracking. It provides:

- **Employee Lifecycle Management**: Onboarding, professional data, leave balances
- **Time & Attendance Tracking**: Check-in/check-out, work hours calculation
- **Project & Task Management**: Multi-client task boards with milestone tracking
- **Ticket System**: External agent ticket submission with task synchronization
- **Payroll Processing**: Salary computation, allowances, deductions

### 1.2 Architectural Role in Platform

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  React Web  │  │ React Native│  │ External    │              │
│  │  Frontend   │  │    App      │  │ Agents      │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND LAYER (This System)                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Express.js Server                        │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐ │ │
│  │  │Middleware│→ │ Routes   │→ │ Policy   │→ │ CRUD        │ │ │
│  │  │Chain     │  │ Dispatch │  │ Engine   │  │ Handlers    │ │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────────┘ │ │
│  │                                              ↓              │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐  │ │
│  │  │Socket.IO │  │ Services │← │ Mongoose Models (35+)    │  │ │
│  │  │Real-time │  │ (Hooks)  │  │ MongoDB Collections      │  │ │
│  │  └──────────┘  └──────────┘  └──────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Developer Personas (System Users)

| Persona | System Interaction | Primary Modules |
|---------|-------------------|-----------------|
| **API Consumer** | REST endpoints via `/api/populate/:action/:model` | All models |
| **Frontend Developer** | Socket.IO events, JWT authentication | Auth, Notifications |
| **External Agent** | Agent-specific auth, ticket submission | Tickets, Clients |
| **Platform Engineer** | Configuration routes, policy management | AccessPolicies, Config |

### 1.4 Runtime Environment

| Component | Technology | Purpose |
|-----------|------------|---------|
| Runtime | Node.js (ES Modules) | Server execution |
| Framework | Express.js | HTTP routing, middleware |
| Database | MongoDB + Mongoose | Data persistence, ODM |
| Real-time | Socket.IO | Push notifications, live updates |
| Caching | In-Memory (Policy Cache) | AccessPolicy lookup acceleration |
| Queue | Bull (Redis) + Memory Queue | Async jobs, notification batching |

### 1.5 Integration Footprint

| External System | Integration Method | Purpose |
|-----------------|-------------------|---------|
| Expo Push Service | HTTP POST to `exp.host` | Mobile push notifications |
| Client CORS Origins | Dynamic regex matching | Web/Mobile app access |
| Device UUID Tracking | HTTP Header `x-device-uuid` | Session binding, multi-device |

---

## 2. End-to-End System Flow

### 2.1 Request Lifecycle Overview

Every API request flows through the following technical stages:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         REQUEST LIFECYCLE                                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1. ENTRY POINT                                                           │
│     server.js → src/index.js                                              │
│     ↓                                                                     │
│  2. MIDDLEWARE CHAIN (Sequential)                                         │
│     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│     │agentAuth    │→ │requestTracer│→ │apiHitLogger │→ │authMiddleware│ │
│     │Middleware   │  │(UUID assign)│  │(Log start)  │  │(JWT verify) │  │
│     └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
│     ↓                                                                     │
│  3. ROUTE DISPATCH                                                        │
│     ┌─────────────────────────────────────────────────────────────────┐  │
│     │ /api/auth/*        → AuthController (static)                     │  │
│     │ /api/agent/*       → agentRoutes (agent-specific)                │  │
│     │ /api/populate/*    → populateHelper (dynamic CRUD)               │  │
│     │ /api/config/*      → configRoutes (admin)                        │  │
│     │ /api/files/*       → fileRoutes (upload/download)                │  │
│     └─────────────────────────────────────────────────────────────────┘  │
│     ↓                                                                     │
│  4. POLICY ENGINE (For /api/populate)                                     │
│     ┌─────────────────────────────────────────────────────────────────┐  │
│     │ a. Load cached AccessPolicy for (role, modelName)                │  │
│     │ b. STRICT MODE: Fail if no policy found                          │  │
│     │ c. Validator sanitizes filter, fields, body                      │  │
│     │ d. Registry executor applies row-level filters                   │  │
│     └─────────────────────────────────────────────────────────────────┘  │
│     ↓                                                                     │
│  5. CRUD HANDLER EXECUTION                                                │
│     ┌─────────────────────────────────────────────────────────────────┐  │
│     │ a. Load model service (if exists)                                │  │
│     │ b. Execute beforeCreate/beforeRead/beforeUpdate/beforeDelete     │  │
│     │ c. Execute Mongoose operation                                    │  │
│     │ d. Execute afterCreate/afterRead/afterUpdate/afterDelete         │  │
│     └─────────────────────────────────────────────────────────────────┘  │
│     ↓                                                                     │
│  6. RESPONSE                                                              │
│     { success: true, count: N, data: [...] }                             │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow Stages

#### Stage 1: Data Creation
- Request body parsed via `express.json({ limit: '10mb' })`
- File uploads handled by `multerConfig.js`
- Body sanitized by `Validator.js` against policy's `allowAccess.create`

#### Stage 2: Validation
- Schema validation via Mongoose validators (regex, enum, min/max)
- Policy validation via `forbiddenAccess` field lists
- Custom validation in service `beforeCreate` hooks

#### Stage 3: Authorization
- JWT verification extracts `{id, role, department, designation}`
- PolicyEngine checks `permissions.{action}` boolean
- Registry conditions apply row-level security (e.g., `isSelf`)

#### Stage 4: Approval Orchestration
- Leave/Regularization use `status` enum: `Pending → Approved/Rejected`
- Manager approval triggers service hooks
- Status transitions update related records (Attendance, Employee.leaveStatus)

#### Stage 5: Persistence
- Mongoose `.save()` or `.findOneAndUpdate()` with atomic operations
- Indexes ensure unique constraints (`employeeId + date` for Attendance)
- Timestamps auto-managed via `{ timestamps: true }`

#### Stage 6: Finalization
- Service `afterCreate`/`afterUpdate` hooks execute
- Notifications queued via `asyncNotificationService`
- Socket.IO emits to user rooms

#### Stage 7: Downstream Propagation
- Task status changes sync to linked Tickets (`ticketTaskSync.js`)
- Leave approval creates Attendance records
- Milestone status updates propagate to Client.milestones

---

## 3. Sub-Module Technical Documentation

---

### 3.1 Authentication Sub-Module

#### a. Sub-Module Purpose

Provides secure session-based authentication with per-device token isolation. Designed to support multiple concurrent platforms (web, mobile) with independent session lifecycles.

**Architectural Concerns Addressed**:
- Security: Per-session secrets prevent token replay across devices
- Scalability: Session documents scale horizontally with MongoDB
- Reliability: Refresh token rotation with JTI tracking
- Maintainability: Centralized `AuthController.js` with clear method separation

#### b. Technical Superheroes (System Roles)

| Actor | Responsibility | Boundary | Failure Impact |
|-------|---------------|----------|----------------|
| **AuthController** | Login, refresh, logout logic | Credential validation, token generation | Full auth outage |
| **authMiddleware** | JWT verification per request | Token validation, session lookup | 401 on all protected routes |
| **Session Model** | Token storage, device tracking | MongoDB persistence | Login state lost |
| **Employee Model** | Credential storage (workEmail, password) | BCrypt hash verification | Cannot authenticate |

#### c. Technical Workflow (Step-by-Step)

**Login Flow**:
1. **Request received**: `POST /api/auth/login` with `{workEmail, password, platform}`
2. **Device UUID extraction**: `x-device-uuid` header required
3. **Employee lookup**: Query `Employee.findOne({ "authInfo.workEmail": workEmail })`
4. **Password verification**: `bcrypt.compare(password, employee.authInfo.password)`
5. **Payload construction**: Extract `{id, role, department, designation, name, managerId}`
6. **Secret generation**: `crypto.randomBytes(64).toString('hex')` per session
7. **Token creation**:
   - Access token: 1h (web) / 30d (mobile)
   - Refresh token: 7d (web) / 90d (mobile)
8. **Session persistence**: Create Session document with tokens, secrets, device info
9. **Cookie setting** (web only): `auth_token`, `refresh_token` with appropriate expiry
10. **Response**: `{accessToken, refreshToken, sessionId, platform}`

**Authentication Middleware Flow**:
1. Extract token from `cookies.auth_token` or `Authorization: Bearer`
2. Decode token (without verification) to get `userId`
3. Lookup active session by `{userId, platform, deviceUUID}`
4. Verify token signature using session's stored secret
5. Update `session.lastUsedAt`
6. Attach `req.user = decoded`

#### d. Preceding System Flow

- Employee must exist with `authInfo.workEmail` and hashed password
- Client must provide device UUID header
- CORS origin must be whitelisted

#### e. Subsequent System Flow

- All protected routes receive `req.user` with decoded JWT payload
- Logout invalidates session (`status: 'DeActive'`)
- Refresh creates new token pair with rotated secrets

#### f. System Rules and Validations

| Rule | Implementation |
|------|----------------|
| Email format | Mongoose validator: `/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/` |
| Device UUID required | 400 error if missing header |
| Session uniqueness | One active session per (userId, platform, deviceUUID) |
| Token rotation | Refresh always generates new accessSecret, refreshSecret, jti |

#### g. Exception and Edge Scenarios

| Scenario | System Behavior |
|----------|-----------------|
| Invalid credentials | 401 with "Invalid credentials" |
| Missing device UUID | 400 with "Device UUID header is required" |
| Session not found | 401 with "Session not found" |
| Token replay (wrong jti) | Session deactivated, 403 "Refresh token reuse detected" |
| Expired token | 403 "Invalid or expired token" |

---

### 3.2 Employee Management Sub-Module

#### a. Sub-Module Purpose

Central entity model representing all system users. Contains nested subdocuments for personal data, professional info, authentication, banking, and documents.

**Architectural Concerns Addressed**:
- Scalability: Compound indexes on frequently queried paths
- Performance: Selective population via `populateFields` parameter
- Maintainability: Clear subdocument separation (basicInfo, professionalInfo, etc.)

#### b. Technical Superheroes

| Actor | Responsibility | Failure Impact |
|-------|---------------|----------------|
| **Employee Model** | Schema definition, validation | Core data integrity |
| **employee.js service** | Business logic hooks | N/A (minimal service) |
| **buildReadQuery** | Population handling | Missing related data |

#### c. Technical Workflow

**Employee Creation**:
1. Request via `POST /api/populate/create/employees`
2. PolicyEngine validates role has `create` permission
3. Validator sanitizes body against `allowAccess.create`
4. Mongoose validates:
   - Email formats (basicInfo.email, authInfo.workEmail)
   - Phone format (10 digits)
   - IFSC code format
   - PAN/Aadhar formats
5. Password hashed before save (if authInfo.password provided)
6. Document created with auto-timestamps

**Employee Read (with Population)**:
1. Request: `POST /api/populate/read/employees` with `populateFields`
2. Default populations loaded from `DEFAULT_POPULATE_FIELDS.employees`
3. User overrides merged with defaults
4. Query built with `.populate()` for each ref field:
   - `professionalInfo.designation` → Designation
   - `professionalInfo.department` → Department
   - `professionalInfo.role` → Role
   - `professionalInfo.reportingManager` → Employee (self-ref)

#### d. Data Model Schema

```javascript
Employee {
  basicInfo: {
    firstName, lastName, dob, doa, maritalStatus,
    phone, email, fatherName, motherName,
    address: { street, city, state, zip, country },
    profileImage
  },
  professionalInfo: {
    empId (unique), designation (ref), department (ref),
    role (ref), reportingManager (ref), teamLead (ref),
    level (L1-L4), doj, probationPeriod, confirmDate
  },
  authInfo: { workEmail (unique), password },
  accountDetails: { accountName, accountNo, bankName, branch, ifscCode },
  salaryDetails: { package, basic, ctc, allowances, deductions },
  personalDocuments: { pan, aadhar, esi, pf, documentFiles[] },
  professionalDocuments: { offerLetter, appraisalLetter, otherDocuments[] },
  leaveStatus: [{ leaveType (ref), usedThisMonth, usedThisYear, carriedForward, available }],
  status: enum['Active', 'Inactive', 'Terminated'],
  isActive: Boolean
}
```

#### e. Key Indexes

| Index | Purpose |
|-------|---------|
| `professionalInfo.reportingManager + status` | Team member lookup |
| `professionalInfo.department + status` | Department filtering |
| `authInfo.workEmail` | Login queries |
| `basicInfo.firstName + basicInfo.lastName` | Name search |

---

### 3.3 Attendance & Time Tracking Sub-Module

#### a. Sub-Module Purpose

Tracks daily attendance records with check-in/check-out times, location data, and computed work hours. Supports multiple attendance states and integrates with Leave approval workflow.

#### b. Technical Superheroes

| Actor | Responsibility | Failure Impact |
|-------|---------------|----------------|
| **Attendance Model** | Daily record storage | Missing time data |
| **attendanceService.js** | High-frequency batching | Performance degradation |
| **attendances.js** | CRUD hooks | Calculation errors |
| **AttendanceCron.js** | Scheduled tasks | Stale attendance states |

#### c. Technical Workflow

**Check-In Flow**:
1. Request: `POST /api/populate/create/attendances`
2. Body: `{employee, date, checkIn, location, status: 'Present'}`
3. Unique constraint: One record per (employee, date)
4. Location captured: `{latitude, longitude}`
5. Document created

**Check-Out Flow**:
1. Request: `POST /api/populate/update/attendances/:id`
2. Body: `{checkOut}`
3. Pre-save hook calculates `workHours`:
   ```javascript
   workHours = (checkOut - checkIn) / (1000 * 60 * 60)
   ```
4. Status may update to `Check-Out` or `Early check-out`

**Status Values**:
```javascript
enum: [
  'Present', 'Absent', 'Leave', 'Half Day', 'Work From Home',
  'Early check-out', 'Check-Out', 'Unchecked', 'LOP',
  'Holiday', 'Week Off', 'Pending', 'Late Entry'
]
```

#### d. Data Model Schema

```javascript
Attendance {
  employee (ref: employees, required, indexed),
  date (Date, required, indexed),
  status (enum, default: 'Present'),
  leaveType (ref: leavetypes),
  checkIn (Date),
  checkOut (Date),
  location: { latitude, longitude },
  request (String),
  managerId (ref: employees),
  employeeName (String),
  workHours (Number, 0-24, calculated)
}
```

#### e. Key Indexes

| Index | Purpose |
|-------|---------|
| `employee + date` (unique) | Prevent duplicate entries |
| `employee + status + date` | Employee attendance history |
| `managerId + status + date` | Manager view of team |
| `date + status` | Daily attendance report |

---

### 3.4 Leave Management Sub-Module

#### a. Sub-Module Purpose

Manages the complete leave request lifecycle from submission through approval/rejection. Automatically updates employee leave balances and creates corresponding attendance records upon approval.

#### b. Technical Superheroes

| Actor | Responsibility | Failure Impact |
|-------|---------------|----------------|
| **Leave Model** | Request storage | Lost leave data |
| **leaves.js service** | Balance updates, attendance creation | Incorrect balances |
| **notificationService** | Manager notifications | Delayed approvals |
| **Employee.leaveStatus** | Balance tracking | Inaccurate availability |

#### c. Technical Workflow

**Leave Request Submission**:
1. Request: `POST /api/populate/create/leaves`
2. Required fields: `employeeId, startDate, endDate, totalDays, reason`
3. `afterCreate` hook triggers:
   - Generate notification message
   - Send notification to `managerId`

**Leave Approval Flow**:
1. Manager updates: `POST /api/populate/update/leaves/:id`
2. Body: `{status: 'Approved'}`
3. `beforeUpdate` stores `_oldStatus`
4. `afterUpdate` detects state transition:
   - If `Pending → Approved`:
     a. Find employee's leave bucket for `leaveTypeId`
     b. Calculate total days: `(endDate - startDate) / oneDay + 1`
     c. Update bucket: `usedThisMonth += totalDays`, `usedThisYear += totalDays`, `available -= totalDays`
     d. Create Attendance records for each day with `status: 'Leave'`
   - If `Approved → Rejected` (rollback):
     a. Reverse balance deductions
     b. Delete Attendance records for the leave period

#### d. State Machine

```
              ┌─────────────┐
              │   Pending   │
              └──────┬──────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
┌─────────────┐          ┌─────────────┐
│  Approved   │◄────────►│  Rejected   │
└─────────────┘          └─────────────┘
       │                       │
       │                       │
       ▼                       ▼
 [Creates Attendance]   [No side effects
  Updates Balance]       or Rollback]
```

#### e. Data Model Schema

```javascript
Leave {
  employeeId (ref, required, indexed),
  employeeName (indexed),
  departmentId (ref, indexed),
  leaveTypeId (ref, indexed),
  leaveName (String),
  startDate (required, indexed),
  endDate (required, indexed),
  totalDays (Number, min: 0.5),
  reason (String, 5-500 chars),
  status: enum['Pending', 'Approved', 'Rejected'],
  managerId (ref, indexed),
  managerComments (String),
  approvedAt, rejectedAt,
  document (String),
  isEmergency (Boolean)
}
```

---

### 3.5 Regularization Sub-Module

#### a. Sub-Module Purpose

Handles attendance correction requests when employees miss check-in/check-out or have incorrect times. Links directly to Attendance records for modification upon approval.

#### b. Technical Workflow

1. Employee identifies attendance issue
2. Creates regularization request with original and requested times
3. Manager reviews and approves/rejects
4. Upon approval, linked Attendance record updated with new times

#### c. Data Model Schema

```javascript
Regularization {
  employeeId (ref, required, indexed),
  employeeName, departmentId,
  requestType: 'Regularization',
  requestDate (required, indexed),
  originalCheckIn, originalCheckOut,
  requestedCheckIn (required), requestedCheckOut (required),
  reason (5-500 chars),
  status: enum['Pending', 'Approved', 'Rejected'],
  managerId, approvedBy, approvedAt, rejectedBy, rejectedAt,
  approverComment,
  attendanceId (ref, required, unique per attendance)
}
```

#### d. Key Constraint

| Index | Purpose |
|-------|---------|
| `attendanceId` (unique) | One regularization per attendance |

---

### 3.6 Task Management Sub-Module

#### a. Sub-Module Purpose

Core project management entity. Tasks belong to Clients, can be linked to Tickets (bidirectional sync), support milestone tracking, and feature a comprehensive comment thread system.

#### b. Technical Superheroes

| Actor | Responsibility | Failure Impact |
|-------|---------------|----------------|
| **Tasks Model** | Task storage with rich metadata | Lost project work |
| **tasks.js service** | Creation hooks, sync, notifications | Broken ticket sync |
| **ticketTaskSync.js** | Bidirectional status sync | Inconsistent states |
| **milestoneService.js** | Milestone status propagation | Milestone tracking errors |
| **CommentsThreads Model** | Comment storage | Lost discussions |
| **asyncNotificationService** | Assignment/comment notifications | Missed updates |

#### c. Technical Workflow

**Task Creation**:
1. Request: `POST /api/populate/create/tasks`
2. `beforeCreate`:
   - Add creator to `followers` array
3. Document created with defaults:
   - `status: 'Backlogs'`
   - `priorityLevel: 'Low'`
   - `progress: 0`
4. `afterCreate`:
   - Create CommentsThreads document
   - Link thread to task
   - Queue notifications to all assignees

**Task Update (Status Change)**:
1. `beforeUpdate` stores `_oldStatus` and `_oldAssignedTo`
2. Update executed
3. `afterUpdate`:
   - If linked to Ticket, sync status via `ticketTaskSync`
   - If milestone status changed, propagate to Client.milestones
   - Notify assignees and followers of status change

**Comment Addition**:
1. Update with `{_isComment: true, _commentText: '...', _mentionedUserIds: [...]}`
2. `afterUpdate`:
   - Push comment to CommentsThreads
   - Notify assignees, followers, and mentioned users

#### d. State Machine

```
Backlogs → To Do → In Progress → In Review → Approved → Completed
                         ↓            ↓
                    Rejected ←────────┘
                         ↓
                      Deleted
```

#### e. Data Model Schema

```javascript
Tasks {
  clientId (ref: clients, required, indexed),
  projectTypeId (ref: projecttypes, required, indexed),
  taskTypeId (ref: tasktypes, required),
  createdBy (ref: employees, indexed),
  assignedTo [ref: employees, indexed],
  linkedTicketId (ref: Ticket),
  isFromTicket (Boolean, default: false),
  milestoneId (ref: milestones, indexed),
  milestoneStatus: enum['Pending', 'In Progress', 'Completed', 'On Hold'],
  title (required, text indexed),
  referenceUrl, userStory (text indexed), observation, impacts, acceptanceCreteria,
  attachments [String],
  commentsThread (ref: commentsthreads),
  startDate, endDate (indexed),
  priorityLevel: enum['Low', 'Medium', 'High', 'Weekly Priority'],
  tags [String],
  status: enum['Backlogs', 'To Do', 'In Progress', 'In Review', 'Approved', 'Rejected', 'Completed', 'Deleted'],
  followers [ref: employees],
  estimatedHours, actualHours, progress (0-100)
}
```

---

### 3.7 Ticket Management Sub-Module

#### a. Sub-Module Purpose

External-facing ticket system allowing agents (external users) to submit support requests. Tickets can be converted to development Tasks with full bidirectional synchronization.

#### b. Technical Superheroes

| Actor | Responsibility | Failure Impact |
|-------|---------------|----------------|
| **Ticket Model** | Ticket storage, auto-ID generation | Lost requests |
| **tickets.js service** | Agent handling, task conversion | Broken conversion |
| **ticketTaskSync.js** | Status/assignment sync | State inconsistency |
| **Agent Model** | External user auth | Agent access failure |

#### c. Technical Workflow

**Ticket Creation (by Agent)**:
1. Request: `POST /api/populate/create/tickets`
2. Body includes `agentId`
3. `beforeCreate`:
   - Lookup agent and populate client
   - Set `clientId`, `createdBy`, `createdByModel: 'agents'`
   - Remove `agentId` from body
4. Pre-save hook generates `ticketId`: `TKT000001`
5. If no `userStory`, copy from `description`

**Ticket-to-Task Conversion**:
1. Update with `{pushTaskSync: true}`
2. `beforeUpdate`:
   - If not already converted:
     - Ensure `taskTypeId` exists (or assign default)
     - Ensure `projectTypeId` exists (or assign default)
     - Set `isConvertedToTask: true`, `convertedBy`, `convertedAt`
3. `afterUpdate`:
   - Create Task document with ticket data
   - Create CommentsThreads for task
   - Link ticket to task (`linkedTaskId`)
   - Send notifications to creator and assignees

**Bidirectional Sync**:
- Task status changes → Update linked Ticket status
- Task assignment changes → Sync to Ticket

#### d. Status Mapping (Task → Ticket)

| Task Status | Ticket Status |
|-------------|---------------|
| In Progress | In Progress |
| Review | Review |
| Testing | Testing |
| Completed | Completed |
| Closed | Closed |

#### e. Data Model Schema

```javascript
Ticket {
  ticketId (String, unique, auto-generated),
  title (required, max 200),
  userStory, description (required),
  projectTypeId, type: enum['Bug', 'Feature', 'Enhancement', 'Support'],
  impactAnalysis, url, acceptanceCriteria,
  clientId (ref), taskTypeId (ref),
  priority: enum['Low', 'Medium', 'High', 'Critical'],
  status: enum['Open', 'In Progress', 'Review', 'Testing', 'Completed', 'Closed'],
  createdBy (refPath: createdByModel), createdByModel: enum['employees', 'agents'],
  assignedTo [ref: employees], accountManager (ref), department (ref),
  linkedTaskId (ref: tasks), isConvertedToTask, convertedBy, convertedAt,
  milestoneId, milestoneStatus,
  attachments [{filename, originalName, path, mimetype, size, uploadedAt}],
  dueDate, startDate, liveHours,
  comments [{comment, commentedBy, commentedAt}],
  resolvedAt, closedAt, resolution
}
```

---

### 3.8 Client Management Sub-Module

#### a. Sub-Module Purpose

Represents external organizations (customers). Clients own project types, milestones, and can have external agents for ticket submission.

#### b. Data Model Schema

```javascript
Client {
  name (unique), ownerName, businessType,
  contactInfo [{name, email, phone, designation}],
  email, phone,
  address: {street, city, state, zip, country},
  gstIN (uppercase, 15 chars), source,
  leadStatus: enum['New', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
  leadType (ref), referenceType (ref),
  Status: enum['Active', 'Inactive'],
  agent [ref: agents],
  accountManager (ref: Employee), projectManager (ref: Employee),
  projectTypes [ref: projecttypes],
  proposedProducts [String],
  milestones [{
    milestoneId (ref, required),
    status: enum['Pending', 'In Progress', 'Completed', 'On Hold'],
    assignedTo, dueDate, completedDate, notes
  }]
}
```

---

### 3.9 Daily Activity Sub-Module

#### a. Sub-Module Purpose

Tracks daily work activities per employee. Links to clients, project types, and task types for categorization.

#### b. Data Model Schema

```javascript
DailyActivity {
  client (ref: clients),
  projectType (ref: projecttypes),
  user (ref: employees),
  date (default: now),
  taskType (ref: tasktypes),
  activity (String),
  assignedTo (ref: employees),
  status: enum['Pending', 'Completed', 'In Progress']
}
```

---

### 3.10 Payroll Sub-Module

#### a. Sub-Module Purpose

Manages monthly salary processing including allowances, deductions, overtime, and payment status tracking.

#### b. Data Model Schema

```javascript
Payroll {
  employeeId (ref, required),
  month (1-12, required), year (required),
  basicSalary (required),
  allowances: {hra, transport, medical, other},
  deductions: {pf, esi, tax, other},
  workingDays, presentDays (required),
  overtimeHours, overtimeRate,
  grossSalary, netSalary (required),
  status: enum['Draft', 'Processed', 'Paid'],
  processedBy, processedAt, paidAt
}

// Unique constraint: one payroll per employee per month
Index: {employeeId, month, year} unique
```

---

### 3.11 Notification Sub-Module

#### a. Sub-Module Purpose

Real-time and push notification delivery system. Combines Socket.IO for immediate delivery with Expo Push for mobile notifications.

#### b. Technical Superheroes

| Actor | Responsibility |
|-------|---------------|
| **asyncNotificationService** | Queue and send push notifications |
| **notificationService** | Create notification records |
| **Socket.IO** | Real-time delivery |
| **notificationMessagePrasher** | Generate notification text |

#### c. Technical Workflow

**Push Notification Flow**:
1. Service calls `asyncNotificationService.queuePushNotification(userId, title, body, data)`
2. Lookup user's active session with FCM token
3. POST to `https://exp.host/--/api/v2/push/send`
4. Create notification record in database

**Real-time Notification Flow**:
1. `io.to(userId).emit('notification', data)`
2. Client receives via Socket.IO connection

---

### 3.12 Access Control (ABAC) Sub-Module

#### a. Sub-Module Purpose

Implements Attribute-Based Access Control with strict mode (fail-closed). Policies are cached on startup and can be refreshed dynamically.

#### b. Technical Superheroes

| Actor | Responsibility |
|-------|---------------|
| **AccessPolicies Model** | Policy storage |
| **policyEngine.js** | Policy enforcement |
| **cache.js** | Policy caching |
| **Validator.js** | Field-level access control |
| **registryExecutor.js** | Row-level security |

#### c. Policy Structure

```javascript
AccessPolicy {
  role (ref: roles, required),
  modelName (String, required),
  permissions: {read, create, update, delete} // Booleans,
  forbiddenAccess: {read[], create[], update[], delete[]} // Field blacklists,
  allowAccess: {read[], create[], update[], delete[]} // Field whitelists,
  registry: [String] // Custom condition names,
  conditions: Map<String, Mixed> // Custom condition config
}

// Unique: one policy per (role, modelName)
```

#### d. Policy Evaluation Flow

1. Load policy from cache by `(role, modelName)`
2. **STRICT MODE**: If no policy, throw `CRITICAL SECURITY` error
3. Check `permissions[action]` boolean
4. Sanitize fields via `allowAccess` / `forbiddenAccess`
5. Execute registry conditions for row-level filters

---

## 4. Inter Sub-Module Dependency Flow

### 4.1 Core Dependencies

```
┌─────────────────────────────────────────────────────────────────────┐
│                     INTER-MODULE DEPENDENCIES                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Employee ─────────────────────────────────────────────────────────┐│
│      ↓                                                              ││
│  ┌───┴───┐  ┌───────┐  ┌──────────────┐  ┌─────────┐  ┌─────────┐ ││
│  │Attend.│  │ Leave │  │Regularization│  │ Payroll │  │DailyAct.│ ││
│  └───────┘  └───┬───┘  └──────┬───────┘  └─────────┘  └─────────┘ ││
│                 │             │                                     ││
│                 └─────────────┘                                     ││
│                        ↓                                            ││
│              Attendance Updated                                     ││
│                                                                      ││
└──────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  Client ────────────────────────────────────────────────────────────┐
│      ↓                                                              │
│  ┌───┴────┐  ┌─────────┐                                           │
│  │ Tasks  │←→│ Tickets │ (bidirectional sync)                      │
│  └────────┘  └─────────┘                                           │
│       ↓           ↓                                                 │
│  Milestones   Milestones                                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Shared Services

| Service | Consumers |
|---------|-----------|
| `asyncNotificationService` | Tasks, Tickets, Leaves |
| `ticketTaskSync` | Tasks, Tickets |
| `milestoneService` | Tasks, Clients |

### 4.3 Failure Scenarios

| Scenario | System Behavior |
|----------|-----------------|
| Step fails (Leave approval) | Transaction not atomic; manual rollback may be needed |
| Step skipped (no notification service) | Silent failure, logged to console |
| Dependency unavailable (MongoDB) | 500 error, request fails |
| Ticket-Task sync fails | Logged, states may diverge |

---

## 5. Workflow Diagrams

### 5.1 Request Lifecycle Flowchart

![Request Lifecycle](diagrams/request_lifecycle.png)

### 5.2 Authentication Flow

![Authentication Flow](diagrams/auth_flow.png)

### 5.3 Leave Approval Workflow

![Leave Approval](diagrams/leave_approval.png)

### 5.4 Ticket-to-Task Conversion

![Ticket Task Conversion](diagrams/ticket_task_conversion.png)

### 5.5 ABAC Policy Evaluation

![ABAC Flow](diagrams/abac_policy_flow.png)

---

## 6. Common System Scenarios

### 6.1 Happy Path: Task Creation with Notification

1. **Request**: `POST /api/populate/create/tasks` with title, client, assignees
2. **Middleware**: Auth verified, request logged
3. **Policy**: Role has `create` permission on `tasks`
4. **Validation**: Required fields present, enums valid
5. **Creation**: Document saved with `status: 'Backlogs'`
6. **Post-Hook**:
   - Creator added to followers
   - CommentsThreads created
   - Notifications queued to all assignees
7. **Response**: `{success: true, data: {...}}`

### 6.2 Approval Delay: Leave Request Pending

1. Employee submits leave request (status: `Pending`)
2. Notification sent to manager
3. Manager may not act immediately
4. System state: Leave remains `Pending`, no balance deducted
5. No Attendance records created
6. Manager eventually approves → full flow executes

### 6.3 Rework/Correction Flow: Regularization

1. Employee notices incorrect attendance
2. Creates Regularization request with corrected times
3. Links to existing Attendance record
4. Manager reviews original vs. requested
5. If approved: Attendance record updated
6. If rejected: Original times remain

### 6.4 Exception Handling: Policy Denied

1. Request: `POST /api/populate/delete/employees/:id`
2. Role lacks `delete` permission
3. PolicyEngine throws: `⛔ CRITICAL SECURITY: No policy defined for role...`
4. Response: `{success: false, message: '...'}`, status 500
5. No database modification occurs

---

## 7. Operational Notes

### 7.1 Support Focus

#### What to Verify First in Production Incidents

| Symptom | Check |
|---------|-------|
| 401 Unauthorized everywhere | Verify session exists and is Active |
| 500 on all CRUD | Check AccessPolicies cache populated |
| Notifications not sending | Check FCM token in Session |
| Leave balance incorrect | Verify afterUpdate hook executed |

#### Common System Misconfigurations

| Issue | Resolution |
|-------|------------|
| No policy for role-model pair | Create AccessPolicy document |
| Missing default task/project type | Ensure at least one exists for ticket conversion |
| stale policy cache | POST `/api/config/refresh-policy` |

#### Typical Data-State Issues

| Issue | Query to Diagnose |
|-------|-------------------|
| Orphaned attendance | `Attendance.find({ leaveType: { $exists: true }, status: { $ne: 'Leave' }})` |
| Duplicate sessions | `Session.aggregate([{$group: {_id: {userId:1, deviceUUID:1}, count: {$sum:1}}}]).match({count:{$gt:1}})` |

### 7.2 Implementation Focus

#### Configuration Checkpoints

- [ ] Environment variables loaded (`.env`)
- [ ] MongoDB connection string valid
- [ ] CORS origins configured
- [ ] AccessPolicies seeded for all roles

#### Environment Readiness

- [ ] Node.js 18+ installed
- [ ] MongoDB 5+ running
- [ ] Redis (optional, for Bull queues)

#### UAT Validation Criteria

- [ ] All CRUD operations work for each role
- [ ] Leave approval updates balances correctly
- [ ] Ticket-to-Task conversion creates linked task
- [ ] Notifications delivered to mobile devices

#### Go-Live Technical Readiness

- [ ] Security integration tests pass (`runSecurityTests`)
- [ ] Database indexes created (`databaseIndexer`)
- [ ] Policy cache populated on startup
- [ ] Socket.IO connections stable

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-11 | System | Initial generation |

---

*End of Document*
