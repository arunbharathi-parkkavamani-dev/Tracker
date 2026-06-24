# E2E Lifecycle Test Fix Plan

## Summary

Full analysis of `verification_report.txt` (1,571 lines) reveals **4 failing lifecycle tests** with **distinct root causes** across 3 test files. The fixes are all in the E2E test scripts — **no production model or service code needs to change**.

---

## Bug Catalog

### 🔴 BUG 1: `employeeLifecycle.test.js` — Invalid `allocationType: 'Permanent'`

**Line:** 483 in `employeeLifecycle.test.js`  
**Error (L410–434):**
```
assetallocations validation failed: allocationType: `Permanent` is not a valid enum value
```
**Root Cause:** The `AssetAllocation` model (`AssetAllocation.js:33`) defines:
```js
enum: ['Allocation', 'Transfer', 'Temporary']
```
The test sends `'Permanent'` which doesn't exist in this enum.  
**Fix:** Change `allocationType: 'Permanent'` → `allocationType: 'Allocation'`

---

### 🔴 BUG 2: `assetLifecycle.test.js` — Allocation starts `Active`, service forces `Pending Approval`

**Error (L661–663):**
```
✅ Allocation created: ... (status: "Pending Approval")
   Asset status: "Reserved"
❌ Asset Lifecycle failed: {}
```
**Root Cause:** The `assetallocations.js` service (`beforeCreate`) **always forces** `status = 'Pending Approval'` regardless of what the test sends. The test then checks:
```js
if (assetCheck.status !== 'Allocated') → throws Error
```
Because the allocation is in `Pending Approval`, asset goes to `Reserved` not `Allocated`.  
**Fix:** The test must work with the approval workflow:
1. Create allocation (gets `Pending Approval` → asset `Reserved`)
2. Update allocation to `Active` (triggers OUT ledger → asset `Allocated`)
3. Then proceed to return/repair/disposal

---

### 🔴 BUG 3: `projectLifecycle.test.js` — Session duration check wrong

**Error (L949):**
```
✅ Time Tracker session started
✅ Time Tracker session completed (logged 3 hours)
❌ Project Lifecycle failed: {}
```
**Root Cause:** The session is started with `startTime = 3 hours ago`, then the service's `beforeUpdate` **auto-calculates** duration from `(now - startTime)` and **ignores the `duration` field in the body**. The actual stored duration ≈ `10800 + time_to_complete_update` ≠ exactly `10800`.

Additionally, the test checks `sessionCheck.duration !== 10800` — exact integer equality on a calculated value.  
**Fix:** Change the verification to use `sessionCheck.duration >= 10800` (approximate check ±10s tolerance) instead of exact equality.

---

### 🔴 BUG 4: `ticketLifecycle.test.js` — `resolvedAt` not populated on returned object

**Error (L1129–1132):**
```
   Ticket status set to "In Progress"
✅ Ticket status updated to: "Resolved"
❌ Ticket Lifecycle failed: {}
```
**Root Cause:** The `buildQuery` update for tickets returns the document from `findByIdAndUpdate`. The `resolvedAt` field is set via `ticketTaskSync.js` in the `afterUpdate` hook, but the returned `resolvedTicket` object from `buildQuery` is captured **before** the `afterUpdate` hook has mutated the DB — then the test immediately checks `if (!resolvedTicket.resolvedAt)`.

The `resolvedAt` IS saved to DB, but the returned document from `buildQuery` is a pre-hook snapshot.  
**Fix:** After the update call, re-fetch the ticket from DB to check `resolvedAt`:
```js
const freshTicket = await Ticket.findById(ticket._id).lean();
if (!freshTicket.resolvedAt) throw new Error(...)
```

---

## Proposed Changes

### Fix 1: `employeeLifecycle.test.js`

#### [MODIFY] [employeeLifecycle.test.js](file:///e:/Loigmax/Tracker/backend/src/scripts/e2e/employeeLifecycle.test.js)

- Line ~483: `allocationType: 'Permanent'` → `allocationType: 'Allocation'`
- The allocation is created with `status: 'Active'` but service forces `Pending Approval`. Need to also update allocation to `Active` after creation.

---

### Fix 2: `assetLifecycle.test.js`

#### [MODIFY] [assetLifecycle.test.js](file:///e:/Loigmax/Tracker/backend/src/scripts/e2e/assetLifecycle.test.js)

Rewrite STEP 4 to honor the approval workflow:
- Create allocation → expect `Pending Approval`, asset `Reserved`  
- Update allocation to `Active` → expect asset `Allocated`
- Then return, repair, dispose as before

---

### Fix 3: `projectLifecycle.test.js`

#### [MODIFY] [projectLifecycle.test.js](file:///e:/Loigmax/Tracker/backend/src/scripts/e2e/projectLifecycle.test.js)

- Line 254: Change strict equality `sessionCheck.duration !== 10800` → tolerance check `sessionCheck.duration < 10790` (allows 10s drift)

---

### Fix 4: `ticketLifecycle.test.js`

#### [MODIFY] [ticketLifecycle.test.js](file:///e:/Loigmax/Tracker/backend/src/scripts/e2e/ticketLifecycle.test.js)

- After resolving ticket: re-fetch from DB before checking `resolvedAt`
- After closing ticket: re-fetch from DB before checking `closedAt`

---

## Verification Plan

After applying all fixes, run:
```bash
node --experimental-vm-modules runSystemVerification.js
```
Expected outcomes:
- ✅ Employee Lifecycle: PASS
- ✅ Asset Lifecycle: PASS  
- ✅ Project Lifecycle: PASS
- ✅ Ticket Lifecycle: PASS
- ✅ Resource Allocation: PASS (was already passing)
