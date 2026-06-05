import mongoose from 'mongoose';
import Employee from './src/models/Employee.js';
import dotenv from 'dotenv';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
dotenv.config();

const run = async () => {
  try {
    await mongoose.connect('mongodb+srv://root:root123@tracker.vnkyhhp.mongodb.net/tracker');
    console.log('Connected to DB');

    const employees = await Employee.find({});
    for (const doc of employees) {
      let changed = false;
      const updateQuery = { $set: {} };
      
      // We must use the collection directly because mongoose might not let us read strings that are mapped to Objects
      const rawDoc = await mongoose.connection.db.collection('employees').findOne({ _id: doc._id });
      
      ['basicInfo', 'accountDetails', 'personalDocuments', 'professionalDocuments'].forEach(field => {
        if (typeof rawDoc[field] === 'string') {
          try {
            updateQuery.$set[field] = JSON.parse(rawDoc[field]);
            changed = true;
          } catch (e) {
            updateQuery.$set[field] = {};
            changed = true;
          }
        }
      });
      
      // Clean up empty objects and stringified arrays
      if (rawDoc.basicInfo && typeof rawDoc.basicInfo.profileImage === 'object' && Object.keys(rawDoc.basicInfo.profileImage || {}).length === 0) {
        if (!updateQuery.$set.basicInfo) updateQuery.$set.basicInfo = rawDoc.basicInfo;
        updateQuery.$set.basicInfo.profileImage = "";
        changed = true;
      }
      
      if (rawDoc.personalDocuments && Array.isArray(rawDoc.personalDocuments.documentFiles) && rawDoc.personalDocuments.documentFiles.length === 1 && rawDoc.personalDocuments.documentFiles[0] === '[]') {
        if (!updateQuery.$set.personalDocuments) updateQuery.$set.personalDocuments = rawDoc.personalDocuments;
        updateQuery.$set.personalDocuments.documentFiles = [];
        changed = true;
      }
      
      if (rawDoc.professionalDocuments && Array.isArray(rawDoc.professionalDocuments.otherDocuments) && rawDoc.professionalDocuments.otherDocuments.length === 1 && rawDoc.professionalDocuments.otherDocuments[0] === '[]') {
        if (!updateQuery.$set.professionalDocuments) updateQuery.$set.professionalDocuments = rawDoc.professionalDocuments;
        updateQuery.$set.professionalDocuments.otherDocuments = [];
        changed = true;
      }
      
      if (changed) {
        await mongoose.connection.db.collection('employees').updateOne({ _id: doc._id }, updateQuery);
        console.log('Fixed doc ' + doc._id);
      }
    }
    console.log('Done');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
