# Tracker System Architecture

## 1. High-Level Overview

**Tracker** is a hybrid monolithic application designed for high scalability and dynamic data handling. It uses a **Node.js/Express** backend with a **MongoDB** database, employing advanced patterns like **Attribute-Based Access Control (ABAC)** and **Dynamic Routing** to reduce boilerplate code.

### Core Stack
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Caching**: Redis (for Bull Queues), In-Memory (for Policy/Service Cache)
- **Queue System**: Bull (Redis-backed) + Custom Array Queue (Memory-backed)

---

## 2. Key Architectural Patterns

### A. The "Populate" Pattern (Dynamic CRUD)
Instead of writing individual controllers for every model (e.g., `TasksController`, `EmployeesController`), the system uses a single **Universal Controller**.

- **Route**: `POST /api/populate/:action/:model/:id?`
- **Controller**: `src/helper/populateHelper.js`
- **Mechanism**:
  1. Receives generic request (e.g., `action=read`, `model=tasks`).
  2. Dynamically loads the Mongoose model.
  3. Applies security policies via `policyEngine`.
  4. Delegates to a generic CRUD handler (`buildReadQuery`, `buildCreateQuery`, etc.).
  5. Returns standardized response.

**New Feature > Bulk Upsert**:
The `populateHelper` now supports `action=bulk-upsert`. It accepts an array of changes, iterating through them to dynamically `update` (if exists) or `create` (if new) each record. This enables "Bulk Operations" on the frontend while maintaining "One Record Per Doc" architecture in DB.

**Pros**: Rapid development, consistent API behavior.
**Cons**: Complex debugging, single point of failure (Mitigated by Request Tracing & Strict Mode).

### B. Attribute-Based Access Control (ABAC) & Strict Mode
Security is **data-driven**, not code-driven. Permissions are stored in the MongoDB `AccessPolicies` collection and cached on startup.

- **Strict Mode (Fail Closed)**:
  - If NO policy is found for a Role+Model, the `policyEngine` throws a `500 CRITICAL SECURITY` error.
  - Access is denied by default unless explicitly granted.

- **Policy Engine** (`src/utils/policy/policyEngine.js`):
  - Intercepts every DB request.
  - Checks **Action** (`create`, `read`, ...) + **Role** + **Model**.
  - Enforces **Conditions** (e.g., `isSelf`, `isTeamMember`) via a **Registry**.

- **Sidebar Visibility** (`src/utils/policy/registry/index.js`):
  - Sidebar items are filtered using a special registry function `matchSidebarPermissions`.
  - Checks `allowedDepartments` AND `allowedDesignations` against the user's JWT claims.

### C. Hybrid Service Layer
The business logic is split into three distinct patterns:

| Pattern | Type | Example | Use Case |
| :--- | :--- | :--- | :--- |
| **Hook Services** | Synchronous | `src/services/tasks.js` | Business rules that *must* run during the transaction (e.g., updating leave balance). |
| **Worker Services** | Async (Redis) | `src/services/asyncNotificationService.js` | Heavy tasks (Email, PDF, Reports) that can run later. Uses **Bull/Redis**. |
| **In-Memory Services** | Async (RAM) | `src/services/attendanceService.js` | High-frequency tasks that don't need persistence (e.g., batching 1000 attendance updates). |

---

## 3. Data Flow & Resilience

### Request Life Cycle
1. **Entry**: `server.js` -> `src/index.js`
2. **Middleware**: 
   - `requestTracer`: Assigns UUID to `req.id` for log tracing.
   - `authMiddleware`: Validates JWT & injects User/Dept/Designation.
   - `apiHitLogger`: Logs request start.
3. **Routing**:
   - `api/auth`: Static `AuthController`.
   - `api/config`: Static `ConfigController` (Policy Refresh, Model List).
   - `api/populate`: Dynamic `populateHelper`.
4. **Policy Check**:
   - `policyEngine` loads Cached Policy.
   - `validator` cleans inputs.
   - `registryExecutor` adds mandatory filters (Row-Level Security).
5. **Execution**:
   - `build{Action}Query.js` runs the DB operation.
   - **Pre-Hooks**: Calls `service.before{Action}`.
   - **DB**: Mongoose executes query.
   - **Post-Hooks**: Calls `service.after{Action}`.
6. **Response**: JSON data returned to client.

### System Resilience
- **Startup Self-Checks**: On boot, `src/utils/securityIntegrationTest.js` runs a suite of tests.
  - If tests fail, it logs `CRITICAL WARNING` but **does not crash** the server ("Anti-Fragile").
- **Dynamic Refresh**: `POST /api/config/refresh-policy` reloads the allow-list cache without restarting the node process.

---

## 4. Performance Optimization

### Query Optimizer (`src/utils/queryOptimizer.js`)
A dedicated utility to prevent "Over-fetching".
- **View Types**:
  - `?type=1` (Summary): Returns minimal fields.
  - `?type=2` (Detailed): Returns standard fields.
  - `?type=3` (Statistics): Returns counts/charts.
- **Aggregation**: Automatically switches to MongoDB Aggregation Pipeline for complex joins.

---

## 5. Directory Structure Map

```
backend/src/
├── Config/             # DB connections
├── Controller/         # Hand-written specific controllers (Auth)
├── cron/               # Scheduled tasks
├── crud/               # Generic CRUD builders (The "Populate" Engine)
├── helper/             # populateHelper (The entry point)
├── middlewares/        # Auth, Logging, Validation, RequestTracer
├── models/             # Mongoose Schemas (35+ models)
├── routes/             # API Route definitions
├── services/           # Business Logic (Hooks + Workers)
└── utils/              # Core Utilities
    ├── policy/         # ABAC Security System (PolicyEngine, Registry)
    ├── cache.js        # Policy Cache
    └── queryOptimizer  # Performance Layer
```
