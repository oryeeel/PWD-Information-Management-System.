const router = require('express').Router({mergeParams:true});
const PwdRecord = require('../models/PwdRecord');
const fields = ['proofOfDisability','pwdIdPhoto'];
router.get('/',async(req,res) => {
  try {
    const record = await PwdRecord.findOne({pwdId:req.params.pwdId,deletedAt:null}).select('+proofOfDisability +pwdIdPhoto');
    if (!record) return res.status(404).json({message:'Record not found.'});
    res.json({proofOfDisability:record.proofOfDisability || '',pwdIdPhoto:record.pwdIdPhoto || ''});
  } catch {res.status(500).json({message:'Could not load document photos.'});}
});
router.patch('/:field',async(req,res) => {
  const {field} = req.params;
  const image = req.body.image;
  const match = typeof image === 'string' && image.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!fields.includes(field) || !match || image.length > 550000) return res.status(400).json({message:'Choose a PNG, JPEG or WebP image up to 400 KB.'});
  const bytes = Buffer.from(match[2],'base64');
  const valid = match[1] === 'png' ? bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : match[1] === 'jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP';
  if (!valid || bytes.length > 400000) return res.status(400).json({message:'Choose a valid image up to 400 KB.'});
  try {
    const record = await PwdRecord.findOneAndUpdate({pwdId:req.params.pwdId,deletedAt:null},{$set:{[field]:image,lastEditedAt:new Date()}},{new:true,runValidators:true}).select(`+${field}`);
    if (!record) return res.status(404).json({message:'Record not found.'});
    res.json({[field]:record[field]});
  } catch {res.status(500).json({message:'Could not save document photo.'});}
});
module.exports = router;
