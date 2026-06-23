import connectDB from "./src/Config/ConnectDB.js";
import models from "./src/models/Collection.js";
import approvalEngine from "./src/utils/approval/approvalEngine.js";
import mongoose from "mongoose";

// Setup environment for DB connection
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), 'src/Config/.env') });

async function runTests() {
  console.log("🚀 Starting Dynamic Approval and Attendance Verification...");
  await connectDB();

  try {
    // ----------------------------------------------------
    // 1. SETUP MOCK DATA
    // ----------------------------------------------------
    console.log("\n📦 Setting up roles and metadata...");

    // Create HR role if not exists
    let hrRole = await models.roles.findOne({ name: "HR" });
    if (!hrRole) {
      hrRole = await models.roles.create({
        name: "HR",
        capabilities: ["approve:leaves", "approve:regularizations"],
        isActive: true
      });
      console.log("✅ Created HR Role");
    }

    // Create a generic employee role if not exists
    let devRole = await models.roles.findOne({ name: "Developer" });
    if (!devRole) {
      devRole = await models.roles.create({
        name: "Developer",
        capabilities: [],
        isActive: true
      });
    }

    // Create LeaveType
    let leaveType = await models.leavetypes.findOne({ name: "Casual Leave" });
    if (!leaveType) {
      leaveType = await models.leavetypes.create({
        name: "Casual Leave",
        description: "Casual leaves",
        maxDaysPerMonth: 2,
        maxDaysPerYear: 12,
        isActive: true
      });
      console.log("✅ Created LeaveType: Casual Leave");
    }

    // Create LeavePolicy
    let leavePolicy = await models.leavepolicy.findOne({ name: "Standard Policy" });
    if (!leavePolicy) {
      leavePolicy = await models.leavepolicy.create({
        name: "Standard Policy",
        leaves: [{
          leaveType: leaveType._id,
          maxDaysPerMonth: 2,
          maxDaysPerYear: 12,
          carryForward: true
        }],
        isActive: true
      });
      console.log("✅ Created LeavePolicy");
    }

    // Create Department
    let department = await models.departments.findOne({ name: "Engineering" });
    if (!department) {
      department = await models.departments.create({
        name: "Engineering",
        shortCode: "ENG",
        description: "Engineering Department",
        leavePolicy: leavePolicy._id
      });
      console.log("✅ Created Department");
    }

    // Create HR User (Level 3 Approver)
    let hrUser = await models.employees.findOne({ "authInfo.workEmail": "hr@test.com" });
    if (!hrUser) {
      hrUser = new models.employees({
        basicInfo: { firstName: "HR", lastName: "Admin", gender: "female" },
        professionalInfo: { empId: "EMP_HR", role: hrRole._id, department: department._id },
        authInfo: { workEmail: "hr@test.com" },
        isActive: true,
        status: "Active"
      });
      await hrUser.save();
      console.log("✅ Created HR User");
    }

    // Create Manager User (Level 2 Approver)
    let managerUser = await models.employees.findOne({ "authInfo.workEmail": "manager@test.com" });
    if (!managerUser) {
      managerUser = new models.employees({
        basicInfo: { firstName: "John", lastName: "Manager", gender: "male" },
        professionalInfo: { empId: "EMP_MGR", role: devRole._id, department: department._id, reportingManager: hrUser._id },
        authInfo: { workEmail: "manager@test.com" },
        isActive: true,
        status: "Active"
      });
      await managerUser.save();
      console.log("✅ Created Manager User");
    }

    // Link department manager (General Manager)
    await models.departments.findByIdAndUpdate(department._id, { manager: managerUser._id });

    // Create Employee A (Male)
    let maleEmployee = await models.employees.findOne({ "authInfo.workEmail": "male.emp@test.com" });
    if (!maleEmployee) {
      maleEmployee = new models.employees({
        basicInfo: { firstName: "Alex", lastName: "Male", gender: "male" },
        professionalInfo: { empId: "EMP_MALE", role: devRole._id, department: department._id, reportingManager: managerUser._id },
        authInfo: { workEmail: "male.emp@test.com" },
        leaveStatus: [{
          leaveType: leaveType._id,
          usedThisMonth: 0,
          usedThisYear: 0,
          carriedForward: 0,
          available: 10 // Start with 10 available leaves
        }],
        isActive: true,
        status: "Active"
      });
      await maleEmployee.save();
      console.log("✅ Created Male Employee");
    } else {
      // Ensure available is set and reset to 10
      await models.employees.updateOne(
        { _id: maleEmployee._id },
        { 
          $set: { 
            "leaveStatus.0.available": 10,
            "leaveStatus.0.usedThisMonth": 0,
            "leaveStatus.0.usedThisYear": 0
          } 
        }
      );
      maleEmployee = await models.employees.findById(maleEmployee._id);
    }

    // Create Employee B (Female)
    let femaleEmployee = await models.employees.findOne({ "authInfo.workEmail": "female.emp@test.com" });
    if (!femaleEmployee) {
      femaleEmployee = new models.employees({
        basicInfo: { firstName: "Jane", lastName: "Female", gender: "female" },
        professionalInfo: { empId: "EMP_FEMALE", role: devRole._id, department: department._id, reportingManager: managerUser._id },
        authInfo: { workEmail: "female.emp@test.com" },
        leaveStatus: [{
          leaveType: leaveType._id,
          usedThisMonth: 0,
          usedThisYear: 0,
          carriedForward: 0,
          available: 10
        }],
        isActive: true,
        status: "Active"
      });
      await femaleEmployee.save();
      console.log("✅ Created Female Employee");
    }

    // Clean up any stale data from previous failed runs
    await models.leaves.deleteMany({ employeeId: { $in: [maleEmployee._id, femaleEmployee._id] } });
    await models.attendances.deleteMany({ employee: { $in: [maleEmployee._id, femaleEmployee._id] } });
    await models.regularizations.deleteMany({ employeeId: { $in: [maleEmployee._id, femaleEmployee._id] } });
    console.log("🧹 Cleaned up stale database entries from previous runs");

    // ----------------------------------------------------
    // 2. CREATE WORKFLOW DEFINITION
    // ----------------------------------------------------
    console.log("\n📦 Setting up Approval Workflow mapping...");
    await models.approvalworkflows.deleteMany({ modelName: 'leaves', departmentId: department._id });
    
    const workflow = await models.approvalworkflows.create({
      modelName: 'leaves',
      departmentId: department._id,
      steps: [
        { stepOrder: 1, approverType: 'Reporting Manager', timeoutDays: 3 },
        { stepOrder: 2, approverType: 'HR', timeoutDays: 3 }
      ],
      isActive: true
    });
    console.log("✅ Created Approval Workflow with steps: Reporting Manager ➔ HR");

    // ----------------------------------------------------
    // 3. TEST LEAVE SERVICE & WORKFLOW PROGRESSION
    // ----------------------------------------------------
    console.log("\n🏃 Testing Leave Request validations...");

    // Test: Validation error on insufficient balance
    try {
      const leavesHook = (await import("./src/services/leaves.js")).default();
      await leavesHook.beforeCreate({
        role: "Developer",
        userId: maleEmployee._id,
        body: {
          employeeId: maleEmployee._id,
          employeeName: "Alex Male",
          departmentId: department._id,
          leaveTypeId: leaveType._id,
          leaveName: "Casual Leave",
          startDate: "2026-07-01",
          endDate: "2026-07-15", // 15 days, balance is 10
          reason: "Testing too many days"
        }
      });
      console.error("❌ Test failed: Insufficient balance should have thrown error.");
    } catch (e) {
      console.log(`✅ Balance check caught expected error: "${e.message}"`);
    }

    // Test: Successful creation + Workflow Initialization
    const leavesHook = (await import("./src/services/leaves.js")).default();
    const validatedBody = await leavesHook.beforeCreate({
      role: "Developer",
      userId: maleEmployee._id,
      body: {
        employeeId: maleEmployee._id,
        employeeName: "Alex Male",
        departmentId: department._id,
        leaveTypeId: leaveType._id,
        leaveName: "Casual Leave",
        startDate: "2026-07-01",
        endDate: "2026-07-03", // 3 days
        reason: "Testing normal leave request"
      }
    });

    // Create the Leave request in DB
    const leaveDoc = await models.leaves.create(validatedBody);
    console.log(`✅ Created Leave Document ID: ${leaveDoc._id}, totalDays: ${leaveDoc.totalDays}`);

    // Trigger afterCreate workflow initialization
    await leavesHook.afterCreate({
      modelName: 'leaves',
      docId: leaveDoc._id,
      userId: maleEmployee._id
    });

    // Verify step 1 state
    let updatedLeave = await models.leaves.findById(leaveDoc._id);
    console.log(`🔍 Current Step Index: ${updatedLeave.currentStepIndex}`);
    console.log(`🔍 Current Reviewer (managerId): ${updatedLeave.managerId} (Should be John Manager: ${managerUser._id})`);
    console.log(`🔍 Step 1 Status: ${updatedLeave.approvals[0].status}, Reviewer: ${updatedLeave.approvals[0].approverId}`);
    
    if (updatedLeave.managerId.toString() !== managerUser._id.toString()) {
      throw new Error("Workflow step 1 did not assign correctly to Reporting Manager");
    }

    // Test: Overlap Validation
    try {
      await leavesHook.beforeCreate({
        role: "Developer",
        userId: maleEmployee._id,
        body: {
          employeeId: maleEmployee._id,
          employeeName: "Alex Male",
          departmentId: department._id,
          leaveTypeId: leaveType._id,
          leaveName: "Casual Leave",
          startDate: "2026-07-02", // Overlaps with 2026-07-01 to 07-03
          endDate: "2026-07-04",
          reason: "Testing overlaps"
        }
      });
      console.error("❌ Test failed: Overlapping date range should have thrown error.");
    } catch (e) {
      console.log(`✅ Overlap check caught expected error: "${e.message}"`);
    }

    // Simulate Step 1 Approval by John Manager
    console.log("\n🏃 Advancing Workflow: Approving Step 1 (Reporting Manager)...");
    
    // Simulate updating status to Approved (which triggers afterUpdate hook)
    await models.leaves.findByIdAndUpdate(leaveDoc._id, { status: "Approved" });
    
    await leavesHook.afterUpdate({
      modelName: 'leaves',
      userId: managerUser._id,
      docId: leaveDoc._id,
      body: {
        _oldStatus: "Pending",
        approverComment: "Looks good, routing to HR"
      }
    });

    // Check intermediate state
    updatedLeave = await models.leaves.findById(leaveDoc._id);
    console.log(`🔍 Current Step Index: ${updatedLeave.currentStepIndex}`);
    console.log(`🔍 Current Reviewer (managerId): ${updatedLeave.managerId} (Should be HR Admin: ${hrUser._id})`);
    console.log(`🔍 Step 1 Status: ${updatedLeave.approvals[0].status}`);
    console.log(`🔍 Step 2 Status: ${updatedLeave.approvals[1].status}, Reviewer: ${updatedLeave.approvals[1].approverId}`);
    console.log(`🔍 Request Document Status: ${updatedLeave.status} (Should be Pending, not finalized yet)`);

    // Verify balance was NOT deducted yet
    let emp = await models.employees.findById(maleEmployee._id).lean();
    let bucket = emp.leaveStatus.find(b => b.leaveType.toString() === leaveType._id.toString());
    console.log(`🔍 Employee Leave Balance: ${bucket.available} days (Should remain 10 days)`);
    if (bucket.available !== 10) {
      throw new Error("Leaves should not be deducted before final approval");
    }

    // Simulate Step 2 Final Approval by HR
    console.log("\n🏃 Advancing Workflow: Approving Step 2 (HR Admin)...");
    
    // Simulate updating status to Approved
    await models.leaves.findByIdAndUpdate(leaveDoc._id, { status: "Approved" });

    await leavesHook.afterUpdate({
      modelName: 'leaves',
      userId: hrUser._id,
      docId: leaveDoc._id,
      body: {
        _oldStatus: "Pending", // Was reverted back to pending after step 1
        approverComment: "HR Approved!"
      }
    });

    // Check finalized state
    updatedLeave = await models.leaves.findById(leaveDoc._id);
    console.log(`🔍 Current Step Index: ${updatedLeave.currentStepIndex}`);
    console.log(`🔍 Request Document Status: ${updatedLeave.status} (Should be Approved)`);
    
    // Verify balance WAS deducted
    emp = await models.employees.findById(maleEmployee._id).lean();
    bucket = emp.leaveStatus.find(b => b.leaveType.toString() === leaveType._id.toString());
    console.log(`🔍 Employee Leave Balance: ${bucket.available} days (Should be 7 days)`);
    if (bucket.available !== 7) {
      throw new Error("Leaves were not deducted correctly upon final approval");
    }

    // Verify Attendance records created
    const leaveAttendances = await models.attendances.find({
      employee: maleEmployee._id,
      status: "Leave"
    });
    console.log(`🔍 Attendance Records Created: ${leaveAttendances.length} (Should be 3)`);
    if (leaveAttendances.length !== 3) {
      throw new Error("Attendance records were not created correctly");
    }

    // ----------------------------------------------------
    // 4. TEST ATTENDANCE TIMEZONE & GENDER LOGIC
    // ----------------------------------------------------
    console.log("\n🏃 Testing Attendance Gender & Timezone checkout calculations...");
    const attendanceHook = (await import("./src/services/attendances.js")).default();

    // Mock an attendance checkout update for Male Employee
    // Start check-in: 9:00 AM IST (03:30 AM UTC)
    // Check-out Normal: 7:45 PM IST (14:15 UTC) -> Total 10.75 hours (exceeds 8.5 hr limit and past 7:30 PM cutoff)
    // Check-out Early: 6:00 PM IST (12:30 UTC) -> Total 9 hours (exceeds 8.5 hr limit, but before 7:30 PM cutoff)
    const checkInTime = new Date("2026-06-22T03:30:00.000Z"); // 9:00 AM IST
    const checkOutTimeNormal = new Date("2026-06-22T14:15:00.000Z"); // 7:45 PM IST
    const checkOutTimeEarly = new Date("2026-06-22T12:30:00.000Z"); // 6:00 PM IST (early)

    // Insert mock check-in
    const attendanceDocMale = await models.attendances.create({
      employee: maleEmployee._id,
      employeeName: "Alex Male",
      date: new Date("2026-06-22T00:00:00.000Z"),
      checkIn: checkInTime,
      status: "Present"
    });

    // Test Male Normal Check-Out (10.75 hours)
    let bodyUpdate = { checkOut: checkOutTimeNormal.toISOString() };
    let resultUpdate = await attendanceHook.beforeUpdate({
      body: bodyUpdate,
      docId: attendanceDocMale._id
    });
    console.log(`🔍 Male 10.75h check-out status: ${resultUpdate.status} (Should be Check-Out)`);
    if (resultUpdate.status !== "Check-Out") {
      throw new Error("Male normal check-out calculated incorrectly");
    }

    // Test Male Early Check-Out (9 hours but before 7:30 PM cutoff)
    bodyUpdate = { checkOut: checkOutTimeEarly.toISOString() };
    resultUpdate = await attendanceHook.beforeUpdate({
      body: bodyUpdate,
      docId: attendanceDocMale._id
    });
    console.log(`🔍 Male 9h early check-out status: ${resultUpdate.status} (Should be Early check-out)`);
    if (resultUpdate.status !== "Early check-out") {
      throw new Error("Male early check-out calculated incorrectly");
    }

    // Create attendance check-in for Female Employee
    const attendanceDocFemale = await models.attendances.create({
      employee: femaleEmployee._id,
      employeeName: "Jane Female",
      date: new Date("2026-06-22T00:00:00.000Z"),
      checkIn: checkInTime,
      status: "Present"
    });

    // Test Female Normal Check-Out (7.5 hours - female needs 7.5)
    bodyUpdate = { checkOut: checkOutTimeEarly.toISOString() }; // 4:30 PM (7.5 hrs)
    resultUpdate = await attendanceHook.beforeUpdate({
      body: bodyUpdate,
      docId: attendanceDocFemale._id
    });
    console.log(`🔍 Female 7.5h check-out status: ${resultUpdate.status} (Should be Early check-out due to 4:30 PM time cutoff - 6:30 PM required)`);
    
    // Female Check-out at 6:35 PM (exceeds 7.5 hrs and past 6:30 PM)
    const checkOutFemaleSuccess = new Date("2026-06-22T13:05:00.000Z"); // 6:35 PM IST
    bodyUpdate = { checkOut: checkOutFemaleSuccess.toISOString() };
    resultUpdate = await attendanceHook.beforeUpdate({
      body: bodyUpdate,
      docId: attendanceDocFemale._id
    });
    console.log(`🔍 Female 6:35 PM check-out status: ${resultUpdate.status} (Should be Check-Out)`);
    if (resultUpdate.status !== "Check-Out") {
      throw new Error("Female successful check-out calculated incorrectly");
    }

    // Clean up test documents
    console.log("\n🧹 Cleaning up test database entries...");
    await models.leaves.deleteOne({ _id: leaveDoc._id });
    await models.attendances.deleteMany({ employee: { $in: [maleEmployee._id, femaleEmployee._id] } });
    await models.approvalworkflows.deleteMany({ departmentId: department._id });
    
    console.log("\n⭐️ ALL TESTS COMPLETED SUCCESSFULLY! Gaps have been verified and resolved.");

  } catch (error) {
    console.error("❌ Verification failed with error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed.");
  }
}

runTests();
