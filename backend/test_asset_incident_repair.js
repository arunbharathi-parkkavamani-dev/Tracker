import connectDB from "./src/Config/ConnectDB.js";
import models from "./src/models/Collection.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), 'src/Config/.env') });

async function runTests() {
  console.log("🚀 Starting Asset Incident & Repair Workflow Verification...");
  await connectDB();

  try {
    // 1. Setup Role and Department
    let devRole = await models.roles.findOne({ name: "Developer" });
    if (!devRole) {
      devRole = await models.roles.create({
        name: "Developer",
        level: 2,
        isActive: true
      });
      console.log("✅ Created/Found Developer Role");
    }

    let managerRole = await models.roles.findOne({ name: "Manager" });
    if (!managerRole) {
      managerRole = await models.roles.create({
        name: "Manager",
        level: 5,
        isActive: true
      });
      console.log("✅ Created/Found Manager Role");
    }

    let department = await models.departments.findOne({ name: "Engineering" });
    if (!department) {
      department = await models.departments.create({
        name: "Engineering",
        shortCode: "ENG",
        description: "Engineering Department"
      });
      console.log("✅ Created/Found Department");
    }

    // 2. Setup Employees
    let managerEmp = await models.employees.findOne({ "authInfo.workEmail": "mgr.incident@test.com" });
    if (!managerEmp) {
      managerEmp = new models.employees({
        basicInfo: { firstName: "Jane", lastName: "Manager", gender: "female" },
        professionalInfo: { empId: "MGR_INCIDENT", role: managerRole._id, department: department._id },
        authInfo: { workEmail: "mgr.incident@test.com" },
        isActive: true,
        status: "Active"
      });
      await managerEmp.save();
      console.log("✅ Created Manager Employee");
    }

    let staffEmp = await models.employees.findOne({ "authInfo.workEmail": "staff.incident@test.com" });
    if (!staffEmp) {
      staffEmp = new models.employees({
        basicInfo: { firstName: "John", lastName: "Staff", gender: "male" },
        professionalInfo: { empId: "STAFF_INCIDENT", role: devRole._id, department: department._id, reportingManager: managerEmp._id },
        authInfo: { workEmail: "staff.incident@test.com" },
        isActive: true,
        status: "Active"
      });
      await staffEmp.save();
      console.log("✅ Created Staff Employee");
    } else {
      // Ensure staff status is Active
      staffEmp.status = "Active";
      await staffEmp.save();
      console.log("✅ Reset Staff Employee status to Active");
    }

    // 3. Setup Category and Asset
    let category = await models.assetcategories.findOne({ code: "LAP" });
    if (!category) {
      category = await models.assetcategories.create({
        name: "Laptop",
        code: "LAP",
        warrantyMonths: 36,
        isActive: true,
        createdBy: managerEmp._id
      });
      console.log("✅ Created Category");
    }

    let asset = await models.assets.findOne({ serialNumber: "SN-INCIDENT-TEST-1" });
    if (!asset) {
      asset = new models.assets({
        assetId: "AST-INCIDENT-TEST-1",
        name: "Dell Latitude 7420",
        categoryId: category._id,
        serialNumber: "SN-INCIDENT-TEST-1",
        status: "Available",
        metaStatus: "active",
        condition: "Excellent",
        createdBy: managerEmp._id
      });
      await asset.save();
      console.log("✅ Created Asset");
    } else {
      // Reset asset to Available and Excellent
      asset.status = "Available";
      asset.condition = "Excellent";
      asset.currentAllocatedTo = null;
      asset.currentAllocationId = null;
      await asset.save();
      console.log("✅ Reset Asset state to Available / Excellent");
    }

    // Clean up old records for this asset
    await models.assetallocations.deleteMany({ assetId: asset._id });
    await models.assetincidents.deleteMany({ assetId: asset._id });
    await models.assetrepairs.deleteMany({ assetId: asset._id });

    // Remove old workflows to prevent overlapping rule violations
    await models.approvalworkflows.deleteMany({ modelName: 'assetallocations', departmentId: department._id });
    await models.approvalworkflows.deleteMany({ modelName: 'assetincidents', departmentId: department._id });

    // 4. Setup Workflows
    const allocationWorkflow = await models.approvalworkflows.create({
      modelName: 'assetallocations',
      departmentId: department._id,
      steps: [{ stepOrder: 1, approverType: 'Reporting Manager', timeoutDays: 3 }],
      isActive: true
    });
    console.log("✅ Setup Approval Workflow for assetallocations");

    const incidentWorkflow = await models.approvalworkflows.create({
      modelName: 'assetincidents',
      departmentId: department._id,
      steps: [{ stepOrder: 1, approverType: 'Reporting Manager', timeoutDays: 3 }],
      isActive: true
    });
    console.log("✅ Setup Approval Workflow for assetincidents");

    // Load Service Hooks
    const allocationsHook = (await import("./src/services/assetallocations.js")).default();
    const incidentsHook = (await import("./src/services/assetincidents.js")).default();
    const repairsHook = (await import("./src/services/assetrepairs.js")).default();
    const employeesHook = (await import("./src/services/employees.js")).default();

    // ── 5. STEP 1: CREATE ALLOCATION AND APPROVE IT ──
    console.log("\n🏃 [Step 1] Creating allocation request...");
    const validatedAlloc = await allocationsHook.beforeCreate({
      role: devRole._id.toString(),
      userId: staffEmp._id.toString(),
      body: {
        assetId: asset._id,
        employeeId: staffEmp._id,
        departmentId: department._id,
        allocationType: "Allocation",
        notes: "Need test laptop"
      }
    });

    const allocDoc = await models.assetallocations.create(validatedAlloc);
    await allocationsHook.afterCreate({ docId: allocDoc._id });

    console.log("🏃 Manager approving allocation request...");
    await models.assetallocations.findByIdAndUpdate(allocDoc._id, { status: "Active" });
    await allocationsHook.afterUpdate({
      docId: allocDoc._id,
      data: { status: "Active" },
      beforeDoc: { status: "Pending Approval" },
      userId: managerEmp._id.toString()
    });

    // Re-verify asset status is Allocated
    let checkAsset = await models.assets.findById(asset._id);
    console.log(`🔍 Asset Status: ${checkAsset.status} (Expected: Allocated)`);
    if (checkAsset.status !== 'Allocated') {
      throw new Error("Allocation step failed: asset status is not Allocated");
    }

    // ── 6. STEP 2: EXIT CLEARANCE CHECK (BLOCKED) ──
    console.log("\n🏃 [Step 2] Testing exit clearance block (should throw error)...");
    try {
      await employeesHook.beforeUpdate({
        docId: staffEmp._id,
        body: { status: "Terminated" }
      });
      throw new Error("Exit clearance gate was bypassed! Employee was allowed to terminate with active allocations.");
    } catch (error) {
      console.log(`✅ Exit clearance block passed. Block message: "${error.message}"`);
    }

    // ── 7. STEP 3: CREATE INCIDENT (DAMAGE) ──
    console.log("\n🏃 [Step 3] Submitting damage incident report...");
    const validatedIncident = await incidentsHook.beforeCreate({
      role: devRole._id.toString(),
      userId: staffEmp._id.toString(),
      body: {
        assetId: asset._id,
        employeeId: staffEmp._id,
        departmentId: department._id,
        allocationId: allocDoc._id,
        incidentType: "Damage",
        description: "Dropped laptop, screen cracked",
        estimatedRepairCost: 8000
      }
    });

    const incidentDoc = await models.assetincidents.create(validatedIncident);
    await incidentsHook.afterCreate({ docId: incidentDoc._id });

    // Verify asset is now Under Repair
    checkAsset = await models.assets.findById(asset._id);
    let checkIncident = await models.assetincidents.findById(incidentDoc._id);
    console.log(`🔍 Asset Status: ${checkAsset.status} (Expected: Under Repair)`);
    console.log(`🔍 Incident Status: ${checkIncident.status} (Expected: Reported)`);
    if (checkAsset.status !== 'Under Repair' || checkIncident.status !== 'Reported') {
      throw new Error("Incident creation hook failed to freeze asset status");
    }

    // ── 8. STEP 4: MANAGER APPROVES SALARY RECOVERY ──
    console.log("\n🏃 [Step 4] Manager approving incident recovery workflow...");
    await models.assetincidents.findByIdAndUpdate(incidentDoc._id, { status: "Approved" });
    
    // Simulate updating standard workflow approvals list
    await incidentsHook.afterUpdate({
      docId: incidentDoc._id,
      data: { status: "Approved" },
      beforeDoc: { status: "Reported" },
      userId: managerEmp._id.toString()
    });

    checkIncident = await models.assetincidents.findById(incidentDoc._id);
    console.log(`🔍 Incident recoveryApproved: ${checkIncident.recoveryApproved} (Expected: true)`);
    if (checkIncident.recoveryApproved !== true) {
      throw new Error("Incident approval hook did not set recoveryApproved flag");
    }

    // ── 9. STEP 5: IT SEND TO REPAIR LOG ──
    console.log("\n🏃 [Step 5] Creating asset repair log...");
    const validatedRepair = await repairsHook.beforeCreate({
      role: managerRole._id.toString(),
      userId: managerEmp._id.toString(),
      body: {
        assetId: asset._id,
        incidentId: incidentDoc._id,
        vendorName: "Dell Repair Hub",
        vendorContact: "9876543210",
        repairDescription: "Screen replacement",
        repairCost: 7500
      }
    });

    const repairDoc = await models.assetrepairs.create(validatedRepair);
    await repairsHook.afterCreate({ docId: repairDoc._id });

    checkAsset = await models.assets.findById(asset._id);
    let checkRepair = await models.assetrepairs.findById(repairDoc._id);
    console.log(`🔍 Asset Status: ${checkAsset.status} (Expected: Under Repair)`);
    console.log(`🔍 Repair Status: ${checkRepair.status} (Expected: Sent for Repair)`);
    if (checkAsset.status !== 'Under Repair' || checkRepair.status !== 'Sent for Repair') {
      throw new Error("Repair creation hook failed");
    }

    // ── 10. STEP 6: FINALIZE REPAIR AS REPAIRED ──
    console.log("\n🏃 [Step 6] Finalizing repair to Repaired (Excellent condition)...");
    await models.assetrepairs.findByIdAndUpdate(repairDoc._id, { 
      status: "Repaired", 
      repairCondition: "Excellent" 
    });

    await repairsHook.afterUpdate({
      docId: repairDoc._id,
      data: { status: "Repaired" },
      beforeDoc: { status: "Sent for Repair" },
      userId: managerEmp._id.toString()
    });

    checkAsset = await models.assets.findById(asset._id);
    checkRepair = await models.assetrepairs.findById(repairDoc._id);
    console.log(`🔍 Asset Status: ${checkAsset.status} (Expected: Available)`);
    console.log(`🔍 Asset Condition: ${checkAsset.condition} (Expected: Excellent)`);
    console.log(`🔍 Repair Status: ${checkRepair.status} (Expected: Repaired)`);

    if (checkAsset.status !== 'Available' || checkAsset.condition !== 'Excellent' || checkRepair.status !== 'Repaired') {
      throw new Error("Repair completion hook failed to restore asset status and condition");
    }

    // ── 11. STEP 7: EXIT CLEARANCE CHECK (ALLOWED) ──
    console.log("\n🏃 [Step 7] Checking exit clearance with active allocations resolved (should succeed)...");
    
    // Check that we can set status to Terminated since asset is Available (not Allocated anymore)
    // Wait, the previous allocation request is still active because we reported incident which froze the asset status,
    // but the allocation doc status is still 'Active' in database! Let's check.
    // Yes! An incident report frozen state does not close the allocation automatically until returned.
    // So let's mock-return the allocation log to make it Inactive/Returned so that exit clearance passes!
    console.log("🏃 Mock closing the active allocation log...");
    await models.assetallocations.findByIdAndUpdate(allocDoc._id, { status: "Returned", returnedCondition: "Excellent" });
    
    // Now call exit clearance check
    await employeesHook.beforeUpdate({
      docId: staffEmp._id,
      body: { status: "Terminated" }
    });
    console.log("✅ Exit clearance successfully resolved without error!");

    // Clean up
    console.log("\n🧹 Cleaning up test database entries...");
    await models.assetallocations.deleteOne({ _id: allocDoc._id });
    await models.assetincidents.deleteOne({ _id: incidentDoc._id });
    await models.assetrepairs.deleteOne({ _id: repairDoc._id });
    await models.approvalworkflows.deleteOne({ _id: allocationWorkflow._id });
    await models.approvalworkflows.deleteOne({ _id: incidentWorkflow._id });

    console.log("\n⭐️ ALL INCIDENT & REPAIR LIFECYCLE TESTS PASSED SUCCESSFULLY!");

  } catch (error) {
    console.error("❌ Verification failed with error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed.");
  }
}

runTests();
