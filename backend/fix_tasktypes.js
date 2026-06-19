import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

dotenv.config({ path: path.resolve(process.cwd(), 'src/Config/.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL;

async function update() {
  if (!MONGO_URI) {
    console.error('MONGO_URI not found. Check src/Config/.env');
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  await import('./src/models/Collection.js');
  const TaskType = mongoose.model('tasktypes');

  // Let's set default icons and colors for standard tasktypes
  const types = [
    { name: 'Bug', icon: 'Bug', color: 'var(--tracker-danger)' },
    { name: 'Training', icon: 'GraduationCap', color: 'var(--brand-teal)' },
    { name: 'Development', icon: 'Code2', color: 'var(--tracker-info)' },
    { name: 'Testing', icon: 'TestTube2', color: 'var(--module-project)' },
    { name: 'Design', icon: 'Palette', color: 'var(--module-hr)' },
    { name: 'Documentation', icon: 'FileText', color: 'var(--ink-subtle)' },
    { name: 'Meeting', icon: 'Users', color: 'var(--tracker-warning)' },
    { name: 'General', icon: 'Workflow', color: 'var(--brand-purple)' },
  ];

  for (const t of types) {
    await TaskType.findOneAndUpdate(
      { name: t.name },
      { $set: { icon: t.icon, color: t.color } },
      { upsert: true, new: true }
    );
    console.log(`Updated/Created TaskType: ${t.name} -> icon: ${t.icon}, color: ${t.color}`);
  }

  // Also make sure any other task types have some defaults
  const all = await TaskType.find({});
  for (const doc of all) {
    if (!doc.icon) {
      doc.icon = 'HelpCircle';
      doc.color = 'var(--ink-subtle)';
      await doc.save();
      console.log(`Set fallback for TaskType: ${doc.name}`);
    }
  }

  console.log('Done!');
  await mongoose.disconnect();
}

update().catch(err => {
  console.error(err);
  process.exit(1);
});
