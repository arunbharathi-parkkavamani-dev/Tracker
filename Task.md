# 🧾 TASKS_BEFORE_PRODUCTION.md
**Project:** Logimax HR Tracker – Backend  
**Environment:** Express.js + MongoDB + Socket.IO  
**Author:** Arunbharathi  
**Purpose:** Pre-production checklist to verify backend stability, security, and consistency before deploying to production.

---

## 🧠 1. Environment & Configuration
- [ ] `.env` file contains:
  - [ ] `MONGO_URI` (Production DB)
  - [ ] `JWT_SECRET` (Strong and unique)
  - [ ] `PORT`
  - [ ] `CLIENT_URL` (for CORS)
- [ ] Confirm no local test DB connections remain.
- [ ] Cron jobs in `/cron` folder use correct time zone.
- [ ] `dotenv` loaded at the top of `index.js`.

---

## 🧩 2. API & Routing
- [ ] `/api/auth` routes are working for login/signup/token refresh.
- [ ] `/api/populate/:action/:model/:id?` dynamic routes verified for:
  - [ ] `create`
  - [ ] `read`
  - [ ] `update`
  - [ ] `delete`
- [ ] Routes correctly use `authMiddleware` for access control.
- [ ] `populateHelper` merges query and body params as expected.
- [ ] All models referenced in requests exist inside `models/Collection.js`.

---

## 🔐 3. Authentication & Authorization
- [ ] JWT signing uses secure `HS256` or stronger.
- [ ] `authMiddleware` properly handles:
  - [ ] Missing or expired tokens
  - [ ] Invalid user IDs
  - [ ] Role extraction (`decoded.role`)
- [ ] Ensure `req.user` exposes only safe fields (id, name, email, role).
- [ ] Policies verified for each role in cache (admin, manager, employee).
- [ ] Role policies restrict CRUD actions appropriately.

---

## ⚙️ 4. Policy & CRUD Engine
- [ ] `policyEngine` correctly maps `action` to CRUD builder.
- [ ] `Collection.js` includes all required models.
- [ ] Each model has an entry in policy cache.
- [ ] Test dynamic CRUD flow:
  - [ ] ✅ Create → saved document visible
  - [ ] ✅ Read → correct data filtered by role
  - [ ] ✅ Update → only permitted roles succeed
  - [ ] ✅ Delete → soft delete or restricted as per role
- [ ] Confirm service-first fallback order works for each CRUD action.

---

## 🧮 5. Service Layer
### Attendance Service (`attendances.js`)
- [ ] Check-In logic applies correct `Late Entry` cutoff (10:20 AM).
- [ ] Sunday or alternative workday requests move to `"Pending"`.
- [ ] Check-Out calculates:
  - [ ] Male ≥ 8.5 hours
  - [ ] Female ≥ 7.5 hours
  - [ ] Proper “Early Check-Out” status applied.
- [ ] Notification triggers verified for each case.
- [ ] Employee cannot modify other’s attendance.
- [ ] Manager can approve leave or check-out properly.

### Employee Service (`employee.js`)
- [ ] Only admin can terminate employees.
- [ ] `status` updated to `"Terminated"`, not deleted.
- [ ] Ensure soft delete reflected in UI.

---

## 🔔 6. Notifications
- [ ] `createAndSendNotification` and `generateAttendanceNotification` tested end-to-end.
- [ ] Socket.IO connection logs (`User connected`, `joined room`) visible in console.
- [ ] Notifications stored and delivered to correct receiver (`managerId` or `employeeId`).

---

## 🧩 7. Aggregation & Query Safety
- [ ] `safeAggregator.js` tested for:
  - [ ] Stage limit enforcement (`lookup`, `unwind`, `match`)
  - [ ] Graceful fallback on heavy pipeline
  - [ ] Proper `allowDiskUse: true` aggregation
- [ ] Generic `buildReadQuery` correctly handles:
  - [ ] `filter[date][$gte]` parsing
  - [ ] Date range auto-conversion
  - [ ] Field population
  - [ ] Employee-level restrictions (`role === 'employee'` → only their own data)
- [ ] No deprecated MongoDB aggregation functions used.

---

## 🧱 8. Middlewares & Logging
- [ ] `apiHitLogger` logs every API hit with timestamps and user info.
- [ ] `errorHandler` catches all thrown errors gracefully.
- [ ] No unhandled promise rejections in logs.
- [ ] Sensitive error details not sent to frontend.

---

## 🧪 9. Testing & Data Validation
- [ ] Test with sample employees (Admin, Manager, Employee).
- [ ] Verify CRUD across key models:
  - [ ] Attendance
  - [ ] Employee
  - [ ] Leave / Regularization
  - [ ] Department / Policy
- [ ] Validate all request inputs:
  - [ ] Missing fields return 400.
  - [ ] Invalid IDs return 404.
  - [ ] Unauthorized roles return 403.
- [ ] Run stress test for concurrent requests (Socket + API).

---

## 🚀 10. Deployment Readiness
- [ ] Server runs without warnings or unused imports.
- [ ] WebSocket connection stable under multiple clients.
- [ ] Mongo indexes created (for Attendance, Employee).
- [ ] All environment-sensitive URLs and secrets are hidden.
- [ ] Production CORS origin set to your deployed frontend.
- [ ] PM2 or similar process manager ready for launch.

---

✅ **Final Step**
- [ ] Commit latest code to `main` branch.
- [ ] Delete `staging` branch post-merge.
- [ ] Tag release: `v1.0.0-production`.
- [ ] Deploy and test on production server.

---

### 📘 Notes
- For new models → add entry in:
  - `models/Collection.js`
  - Policy cache (read, create, update, delete)
  - Optional service in `/services`
- For debugging dynamic CRUD → enable console logs in:
  - `populateHelper.js`
  - `policyEngine.js`
  - Each CRUD builder.

---

**✅ Ready for Production once all boxes are checked!**
