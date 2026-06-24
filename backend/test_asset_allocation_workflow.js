import connectDB from "./src/Config/ConnectDB.js";
import models from "./src/models/Collection.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), 'src/Config/.env') });

async function runTests() {
  console.log("🚀 Starting Asset Allocation Workflow Verification...");
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
      console.log("✅ Created Developer Role");
    }

    let managerRole = await models.roles.findOne({ name: "Manager" });
    if (!managerRole) {
      managerRole = await models.roles.create({
        name: "Manager",
        level: 5,
        isActive: true
      });
      console.log("✅ Created Manager Role");
    }

    let department = await models.departments.findOne({ name: "Engineering" });
    if (!department) {
      department = await models.departments.create({
        name: "Engineering",
        shortCode: "ENG",
        description: "Engineering Department"
      });
      console.log("✅ Created Department");
    }

    // 2. Setup Employees
    let managerEmp = await models.employees.findOne({ "authInfo.workEmail": "mgr.asset@test.com" });
    if (!managerEmp) {
      managerEmp = new models.employees({
        basicInfo: { firstName: "Jane", lastName: "Manager", gender: "female" },
        professionalInfo: { empId: "MGR_ASSET", role: managerRole._id, department: department._id },
        authInfo: { workEmail: "mgr.asset@test.com" },
        isActive: true,
        status: "Active"
      });
      await managerEmp.save();
      console.log("✅ Created Manager Employee");
    }

    let staffEmp = await models.employees.findOne({ "authInfo.workEmail": "staff.asset@test.com" });
    if (!staffEmp) {
      staffEmp = new models.employees({
        basicInfo: { firstName: "John", lastName: "Staff", gender: "male" },
        professionalInfo: { empId: "STAFF_ASSET", role: devRole._id, department: department._id, reportingManager: managerEmp._id },
        authInfo: { workEmail: "staff.asset@test.com" },
        isActive: true,
        status: "Active"
      });
      await staffEmp.save();
      console.log("✅ Created Staff Employee");
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

    let asset = await models.assets.findOne({ serialNumber: "SN-TEST-ALLOC-1" });
    if (!asset) {
      asset = new models.assets({
        name: "Dell Latitude 7420",
        categoryId: category._id,
        serialNumber: "SN-TEST-ALLOC-1",
        status: "Available",
        metaStatus: "active",
        condition: "Excellent",
        createdBy: managerEmp._id
      });
      // Skip service hook to allow direct custom serial number creation
      await asset.save();
      console.log("✅ Created Asset");
    } else {
      // Reset asset to Available and Excellent for test run
      asset.status = "Available";
      asset.condition = "Excellent";
      asset.currentAllocatedTo = null;
      asset.currentAllocationId = null;
      await asset.save();
      console.log("✅ Reset Asset state to Available / Excellent");
    }

    console.log("🔍 Registered models keys:", Object.keys(models));

    // Clean up old allocations for this asset
    await models.assetallocations.deleteMany({ assetId: asset._id });
    await models.approvalworkflows.deleteMany({ modelName: 'assetallocations', departmentId: department._id });

    // 4. Setup Workflow Configuration
    const workflow = await models.approvalworkflows.create({
      modelName: 'assetallocations',
      departmentId: department._id,
      steps: [
        { stepOrder: 1, approverType: 'Reporting Manager', timeoutDays: 3 }
      ],
      isActive: true
    });
    console.log("✅ Setup Approval Workflow for assetallocations");

    // Load Service Hook
    const allocationsHook = (await import("./src/services/assetallocations.js")).default();

    // 5. TEST: Create Allocation Request (by Staff Employee)
    console.log("\n🏃 Submitting allocation request...");
    const validatedBody = await allocationsHook.beforeCreate({
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

    const allocDoc = await models.assetallocations.create(validatedBody);
    console.log(`✅ Created Allocation Document ID: ${allocDoc._id}`);

    // Trigger afterCreate
    await allocationsHook.afterCreate({ docId: allocDoc._id });

    // Verify status is reserved
    let checkAsset = await models.assets.findById(asset._id);
    let checkAlloc = await models.assetallocations.findById(allocDoc._id);
    console.log(`🔍 Asset Status: ${checkAsset.status} (Expected: Reserved)`);
    console.log(`🔍 Allocation Status: ${checkAlloc.status} (Expected: Pending Approval)`);
    console.log(`🔍 Reviewer Manager ID: ${checkAlloc.managerId} (Expected Manager: ${managerEmp._id})`);

    if (checkAsset.status !== 'Reserved' || checkAlloc.status !== 'Pending Approval') {
      throw new Error("Asset reservation or allocation initiation failed");
    }

    // 6. TEST: Manager Approves Workflow Step
    console.log("\n🏃 Manager approving request...");
    
    // Simulate frontend status update call
    await models.assetallocations.findByIdAndUpdate(allocDoc._id, { status: "Active" });

    // Trigger afterUpdate hook
    await allocationsHook.afterUpdate({
      docId: allocDoc._id,
      data: { status: "Active" },
      beforeDoc: { status: "Pending Approval" },
      userId: managerEmp._id.toString()
    });

    checkAsset = await models.assets.findById(asset._id);
    checkAlloc = await models.assetallocations.findById(allocDoc._id);
    console.log(`🔍 Asset Status: ${checkAsset.status} (Expected: Allocated)`);
    console.log(`🔍 Asset currentAllocatedTo: ${checkAsset.currentAllocatedTo} (Expected Employee: ${staffEmp._id})`);
    console.log(`🔍 Allocation Status: ${checkAlloc.status} (Expected: Active)`);

    if (checkAsset.status !== 'Allocated' || checkAlloc.status !== 'Active') {
      throw new Error("Manager approval did not correctly allocate asset");
    }

    // 7. TEST: Return Flow (with Damaged condition)
    console.log("\n🏃 Returning asset (specifying Damaged condition)...");

    // Simulate returning the asset
    const returnBody = await allocationsHook.beforeUpdate({
      role: devRole._id.toString(),
      userId: staffEmp._id.toString(),
      body: {
        status: "Returned",
        returnedCondition: "Damaged",
        returnNotes: "Spilled tea on keyboard"
      },
      docId: allocDoc._id
    });

    await models.assetallocations.findByIdAndUpdate(allocDoc._id, returnBody);

    // Trigger afterUpdate
    await allocationsHook.afterUpdate({
      docId: allocDoc._id,
      data: { status: "Returned" },
      beforeDoc: { status: "Active" },
      userId: staffEmp._id.toString()
    });

    checkAsset = await models.assets.findById(asset._id);
    checkAlloc = await models.assetallocations.findById(allocDoc._id);
    console.log(`🔍 Asset Status: ${checkAsset.status} (Expected: Under Repair)`);
    console.log(`🔍 Asset Condition: ${checkAsset.condition} (Expected: Damaged)`);
    console.log(`🔍 Allocation Status: ${checkAlloc.status} (Expected: Returned)`);

    if (checkAsset.status !== 'Under Repair' || checkAsset.condition !== 'Damaged' || checkAlloc.status !== 'Returned') {
      throw new Error("Asset return handling failed");
    }

    // Clean up
    console.log("\n🧹 Cleaning up test database entries...");
    await models.assetallocations.deleteOne({ _id: allocDoc._id });
    await models.approvalworkflows.deleteOne({ _id: workflow._id });
    // Keep asset/employee/roles to avoid index warnings / recreate issues

    console.log("\n⭐️ ALL ASSET LIFECYCLE TESTS PASSED SUCCESSFULLY!");

  } catch (error) {
    console.error("❌ Verification failed with error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed.");
  }
}

runTests();
