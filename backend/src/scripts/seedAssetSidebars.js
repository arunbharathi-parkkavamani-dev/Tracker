/**
 * seedAssetSidebars.js
 * Seeds dynamic sidebar configurations for Asset Management.
 * Run: node src/scripts/seedAssetSidebars.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import SideBar from '../models/SideBar.js';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../Config/.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tracker';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // 1. Delete existing asset sidebar entries to prevent duplicates
  await SideBar.deleteMany({ mainRoute: { $regex: /^\/assets/ } });
  console.log('🧹 Cleaned existing asset sidebar entries');

  // 2. Create Parent menu item
  const parentMenu = await SideBar.create({
    title: 'Asset Management',
    icon: { iconName: 'MdDevices', iconPackage: 'react-icons/md' },
    mainRoute: '/assets',
    isParent: true,
    hasChildren: true,
    order: 40,
    isActive: true,
    routes: ['/assets/register', '/assets/allocations', '/assets/incidents', '/assets/categories']
  });
  console.log('📂 Created Parent: Asset Management');

  // 3. Create Child menu items
  const children = [
    { title: 'Asset Register', mainRoute: '/assets/register', order: 1 },
    { title: 'Asset Allocations', mainRoute: '/assets/allocations', order: 2 },
    { title: 'Asset Incidents', mainRoute: '/assets/incidents', order: 3 },
    { title: 'Asset Categories', mainRoute: '/assets/categories', order: 4 },
  ];

  for (const child of children) {
    await SideBar.create({
      title: child.title,
      mainRoute: child.mainRoute,
      parentId: parentMenu._id,
      isParent: false,
      hasChildren: false,
      order: child.order,
      isActive: true,
      routes: [child.mainRoute]
    });
    console.log(`   └─ Created Child: ${child.title}`);
  }

  await mongoose.disconnect();
  console.log('✅ Sidebars seeding complete.');
}

seed().catch(err => {
  console.error('❌ Sidebars seeding failed:', err);
  process.exit(1);
});
