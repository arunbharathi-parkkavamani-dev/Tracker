/**
 * seedHRAdminFullAccess.js
 * Gives the "hr" role full CRUD access (no forbidden fields, no conditions)
 * on every model registered in Collection.js.
 *
 * Run once:
 *   node seedHRAdminFullAccess.js
 *
 * Safe to re-run — uses upsert so it won't create duplicates.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

dotenv.config({ path: path.resolve(process.cwd(), 'src/Config/.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL;

const ALL_MODELS = [
  'accesspolicies',
  'employees',
  'departments',
  'designations',
  'leavetypes',
  'leavepolicy',
  'attendances',
  'sidebars',
  'tasktypes',
  'clients',
  'dailyactivities',
  'apihitlogs',
  'projecttypes',
  'roles',
  'notifications',
  'leaves',
  'tasks',
  'commentsthreads',
  'session',
  'todos',
  'auditlog',
  'errorlog',
  'expenses',
  'payrolls',
  'tickets',
  'shifts',
  'hrpolicies',
  'agents',
  'emailconfigs',
  'milestones',
  'regularizations',
  'referencetypes',
  'leadtypes',
  'feedgroups',
  'feedchannels',
  'feedposts',
  'feedcomments',
  'NotificationReceptionist',
  'products',
  'salarystructures',
  'payrollruns',
  'holidays',
];

const FULL_ACCESS = {
  permissions:    { read: true, create: true, update: true, delete: true },
  forbiddenAccess:{ read: [], create: [], update: [], delete: [] },
  allowAccess:    { read: ['*'], create: ['*'], update: ['*'], delete: ['*'] },
  registry:       [],
  conditions:     {},
};

async function seed() {
  if (!MONGO_URI) {
    console.error('MONGO_URI not found. Check src/Config/.env');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Load models so Mongoose registers their schemas
  await import('./src/models/Collection.js');

  const Role        = mongoose.model('roles');
  const PolicyModel = mongoose.model('accesspolicies');
  console.log("Available Roles:", await Role.find({}).lean());

  // Find the HR Admin role — tries several name variants
  const hrRole = await Role.findOne({
    name: { $in: ['HR Admin', 'hr admin', 'HR', 'hr', 'Hr Admin', 'HRAdmin'] }
  }).lean();

  if (!hrRole) {
    // Print available roles to help diagnose
    const all = await Role.find({}).lean();
    console.error('Could not find an HR role. Available roles:');
    all.forEach(r => console.error(`  - "${r.name}" (${r._id})`));
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`Found HR role: ${hrRole._id} (${hrRole.name})`);

  // Also seed ADMIN role if present
  const adminRole = await Role.findOne({
    name: { $in: ['ADMIN', 'Admin', 'admin', 'Super Admin', 'superadmin'] }
  }).lean();
  if (adminRole) console.log(`Found Admin role: ${adminRole._id} (${adminRole.name})`);

  const rolesToSeed = [hrRole, adminRole].filter(Boolean);

  let upserted = 0;

  for (const role of rolesToSeed) {
    console.log(`\nSeeding full access for role: ${role.name}`);
    for (const modelName of ALL_MODELS) {
      await PolicyModel.findOneAndUpdate(
        { role: role._id, modelName },
        {
          $set: {
            role: role._id,
            modelName,
            ...FULL_ACCESS,
          }
        },
        { upsert: true, new: true }
      );
      upserted++;
      console.log(`  ✓ ${modelName}`);
    }
  }

  console.log(`\n✅ Seeded full access on ${upserted} policies across ${rolesToSeed.length} role(s).`);
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
