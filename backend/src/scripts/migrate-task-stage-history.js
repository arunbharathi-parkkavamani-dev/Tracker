import mongoose from 'mongoose';
import Task from '../models/Tasks.js';
import Employee from '../models/Employee.js';

import dns from "dns";

dns.setServers(['8,8,8,8', '8,8,4,4'])

export async function migrateTasks() {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find all tasks without createdBy (orphans)
    const orphanTasks = await Task.find({ createdBy: null }).session(session);
    console.log(`Found ${orphanTasks.length} orphan tasks`);

    // Assign to a default admin user
    const adminUser = await Employee.findOne({ role: 'admin' }).session(session) || await Employee.findOne().session(session);

    if (adminUser && orphanTasks.length > 0) {
      await Task.updateMany(
        { createdBy: null },
        { $set: { createdBy: adminUser._id } },
        { session }
      );
    }

    // Initialize stageHistory from current status
    const tasksWithoutHistory = await Task.find({
      $or: [
        { stageHistory: { $exists: false } },
        { stageHistory: { $size: 0 } }
      ]
    }).session(session);
    console.log(`Found ${tasksWithoutHistory.length} tasks without stage history`);

    for (const task of tasksWithoutHistory) {
      await Task.updateOne(
        { _id: task._id },
        {
          $set: {
            stageHistory: [{
              stage: task.status || 'Backlogs',
              enteredAt: task.createdAt || new Date(),
              duration: 0
            }]
          }
        },
        { session }
      );
    }

    await session.commitTransaction();
    console.log('Migration completed successfully');
  } catch (error) {
    await session.abortTransaction();
    console.error('Migration failed:', error);
    throw error;
  } finally {
    session.endSession();
  }
}

// Support running directly
if (process.argv[1] && process.argv[1].endsWith('migrate-task-stage-history.js')) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tracker')
    .then(() => migrateTasks())
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
