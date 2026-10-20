// Fill empty emergency-contact fields with fictional demonstration values.
require('dotenv').config({quiet:true});
const mongoose = require('mongoose');
const PwdRecord = require('../models/PwdRecord');

const firstNames = ['Marissa','Roberto','Elena','Ricardo','Teresa','Antonio','Carmen','Eduardo','Rosario','Manuel'];
const lastNames = ['Reyes','Santos','Garcia','Flores','Torres','Cruz','Ramos','Aquino','Castro','Rivera'];
const missing = field => ({$or:[{[field]:{$exists:false}},{[field]:null},{[field]:/^\s*$/}]});

async function main() {
  await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:5000});
  try {
    const records = await PwdRecord.find().sort({pwdId:1}).select('pwdId emergencyContactName emergencyContactPhone').lean();
    const operations = [];
    const affected = new Set();
    for (const [index,record] of records.entries()) {
      const sample = {
        emergencyContactName:`${firstNames[index % firstNames.length]} ${lastNames[(index + Math.floor(index / firstNames.length)) % lastNames.length]}`,
        // Demonstration value only; not a verified emergency contact.
        emergencyContactPhone:`09${String(index+1).padStart(9,'0')}`,
      };
      for (const [field,value] of Object.entries(sample)) {
        if (String(record[field] || '').trim()) continue;
        affected.add(record.pwdId);
        operations.push({updateOne:{filter:{_id:record._id,...missing(field)},update:{$set:{[field]:value}},timestamps:false}});
      }
    }
    const result = operations.length ? await PwdRecord.bulkWrite(operations) : {modifiedCount:0};
    const remaining = await PwdRecord.countDocuments({$or:[missing('emergencyContactName'),missing('emergencyContactPhone')]});
    console.log(JSON.stringify({recordsChecked:records.length,recordsWithMissingFields:affected.size,fieldsUpdated:result.modifiedCount,recordsStillMissingContacts:remaining}));
    if (remaining) throw new Error('Some emergency-contact fields remain empty.');
  } finally { await mongoose.disconnect(); }
}
main().catch(() => {console.error('Could not complete sample emergency-contact update. Check database connectivity.');process.exitCode=1;});
