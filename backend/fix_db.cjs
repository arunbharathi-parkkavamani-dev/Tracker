const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://root:root123@tracker.vnkyhhp.mongodb.net/tracker');

const run = async () => {
  await new Promise(r => setTimeout(r, 2000));
  
  const dept = await mongoose.connection.db.collection('departments').findOne({});
  if (dept) {
    const result = await mongoose.connection.db.collection('employees').updateMany(
      {},
      { $set: { 'professionalInfo.department': dept._id } }
    );
    console.log('Updated employees:', result.modifiedCount);
  } else {
    console.log('No department found');
  }
  
  process.exit();
};

run();
