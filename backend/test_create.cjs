const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const run = async () => {
  await mongoose.connect('mongodb+srv://root:root123@tracker.vnkyhhp.mongodb.net/tracker');
  console.log('Connected to DB');

  // Force cache initialization
  const { setCache, getPolicy } = await import('./src/utils/cache.js');
  await setCache();

  const policyEngine = await import('./src/utils/policy/policyEngine.js');
  
  const role = '68d8b98af397d1d97620ba97'; // Current role
  const userId = '68d8b9daf397d1d97620ba9a'; // User ID
  
  const policy = getPolicy(role, 'attendances');
  console.log('Policy permissions:', policy?.permissions);
  console.log('Policy allowAccess.create:', policy?.allowAccess?.create);
  
  const originalBody = {
    employee: userId,
    employeeName: 'Arunbharathi',
    date: '2026-06-02',
    checkIn: '2026-06-02T17:17:03.081Z',
    status: 'Present',
    managerId: '68d8b8caf397d1d97620ba93',
    workType: 'fixed',
    location: { latitude: 10.9338987, longitude: 76.9839277 }
  };
  
  // Test Validator first
  const validator = (await import('./src/utils/Validator.js')).default;
  const valResult = validator({
    action: 'create',
    modelName: 'attendances',
    role,
    userId,
    body: originalBody,
    policy,
    getPolicy
  });
  console.log('After validator body:', valResult.body);
  
  // Test sanitizeWrite
  const sanitizeWrite = (await import('./src/utils/sanitizeWrite.js')).default;
  const sanResult = sanitizeWrite({ body: valResult.body, policy, action: 'create' });
  console.log('After sanitizeWrite:', sanResult);
  
  // Let's actually execute it via buildQuery to catch it
  try {
    const res = await policyEngine.buildQuery({
      role,
      userId,
      action: 'create',
      modelName: 'attendances',
      body: originalBody
    });
    console.log('Success!', res);
  } catch (e) {
    console.log('Error from buildQuery:', e.message);
  }
  
  process.exit();
};

run().catch(console.error);
