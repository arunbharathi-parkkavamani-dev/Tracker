/**
 * updatePassword.js
 * Script to update employee password.
 * Run: node src/scripts/updatePassword.js
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../Config/.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tracker';

async function updatePassword() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Load models
  await import('../models/Collection.js');
  const Employee = mongoose.model('employees');

  const email = 'arunbharathi@logimaxindia.com';
  const newPasswordRaw = 'admin@123';

  const employee = await Employee.findOne({ 'authInfo.workEmail': email });
  if (!employee) {
    console.error(`❌ Employee with email "${email}" not found.`);
    await mongoose.disconnect();
    return;
  }

  // Hash the new password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(newPasswordRaw, salt);

  // Update password
  employee.authInfo.password = hashedPassword;
  await employee.save();

  console.log(`✅ Password updated successfully for employee: ${employee.basicInfo?.firstName} ${employee.basicInfo?.lastName} (${email})`);
  
  await mongoose.disconnect();
  console.log('🔌 Connection closed.');
}

updatePassword().catch(err => {
  console.error('❌ Failed to update password:', err);
  process.exit(1);
});
