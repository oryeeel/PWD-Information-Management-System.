// Fill missing middle names only on explicitly marked fictional demo records.
require('dotenv').config({quiet:true});
const mongoose = require('mongoose');
const PwdRecord = require('../models/PwdRecord');

const names = ['Reyes','Santos','Cruz','Garcia','Ramos','Flores','Torres','Rivera',
  'Gonzales','Aquino','Castro','Bautista','Dela Pena','Santiago','Perez',
  'Villanueva','Francisco','De Leon','Salvador','Rosales','Estrada','Valencia',
  'Pascual','Miranda','De Guzman','Andrada','Serrano','Soliman','Cabrera','Razon'];
const missing = {$or:[{middleName:{$exists:false}},{middleName:null},{middleName:/^\s*$/}]};

async function main() {
  await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:5000});
  try {
    const records = await PwdRecord.find({addedBy:'Demo Data',...missing}).sort({pwdId:1}).lean();
    const operations = records.map((record,index) => {
      let middleName = names[index % names.length];
      if (middleName === record.lastName) middleName = names[(index+1) % names.length];
      return {updateOne:{filter:{_id:record._id,addedBy:'Demo Data',...missing},
        update:{$set:{middleName}},timestamps:false}};
    });
    const result = operations.length ? await PwdRecord.bulkWrite(operations) : {modifiedCount:0};
    const remaining = await PwdRecord.countDocuments({addedBy:'Demo Data',...missing});
    console.log(JSON.stringify({updated:result.modifiedCount,missingDemoMiddleNames:remaining}));
    if (remaining) throw new Error('Some demo records still have no middle name.');
  } finally { await mongoose.disconnect(); }
}
main().catch(() => {console.error('Could not complete demo middle-name update. Check database connectivity.');process.exitCode=1;});
