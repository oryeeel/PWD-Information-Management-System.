const {test} = require('node:test');
const assert = require('node:assert/strict');
const {EventEmitter} = require('node:events');
const {actorFrom,actionFor,createActivityMiddleware,createActivityListHandler} = require('../activityLogs');
const staff = {id:2,username:'staff1',fullname:'MSWDO Staff 1',role:'Staff'};
const header = actor => ({'x-pwd-actor':encodeURIComponent(JSON.stringify(actor))});
function response() {
  return Object.assign(new EventEmitter(),{statusCode:200,status(code){this.statusCode=code;return this},json(data){this.data=data;return this}});
}
test('records successful staff actions with actor and record ID, excluding request content',async()=>{
  const saved=[];
  const req={headers:header(staff),method:'PUT',path:'/api/records/PWD-0001',body:{contact:'private',bloodType:'private'}};
  const res=response();
  createActivityMiddleware({create:async log=>saved.push(log)})(req,res,()=>{});
  res.json({pwdId:'PWD-0001'});res.emit('finish');
  await Promise.resolve();
  assert.deepEqual(saved,[{staffId:'2',username:'staff1',staffName:'MSWDO Staff 1',action:'Updated record',recordId:'PWD-0001'}]);
});
test('does not record failed requests, admins, missing sessions or unrelated reads',async()=>{
  const saved=[];
  for(const [actor,status,path] of [[staff,400,'/api/records'],[{...staff,role:'Admin'},200,'/api/records'],[null,200,'/api/records'],[staff,200,'/api/records/next-id']]){
    const req={headers:actor?header(actor):{},method:'GET',path};
    const res=response();res.statusCode=status;
    createActivityMiddleware({create:async log=>saved.push(log)})(req,res,()=>{});
    res.emit('finish');
  }
  await Promise.resolve();assert.equal(saved.length,0);
});
test('maps archive, restore, creation, photos and SMS to clear actions',()=>{
  for(const [method,path,action] of [['POST','/api/records/PWD-0001/recycle','Archived record'],['POST','/api/recycle-bin/PWD-0001/restore','Restored record'],['POST','/api/records','Added record'],['PATCH','/api/records/PWD-0001/document-photos/pwdIdPhoto','Updated document photo'],['POST','/api/messages/send','Submitted SMS']]){
    assert.equal(actionFor({method,path,body:{recipientIds:['PWD-0001']}},{pwdId:'PWD-0001'}).action,action);
  }
});
test('staff cannot read activity logs and malformed actors are rejected',async()=>{
  assert.equal(actorFrom({headers:{'x-pwd-actor':'bad-json'}}),null);
  const res=response();
  await createActivityListHandler({})({headers:header(staff),query:{}},res);
  assert.equal(res.statusCode,403);
});
test('admin search uses literal text, Philippine dates, newest-first pagination',async()=>{
  let filter;
  const chain={sort(value){assert.deepEqual(value,{createdAt:-1,_id:-1});return this},skip(value){assert.equal(value,20);return this},limit(value){assert.equal(value,20);return this},lean:async()=>[{action:'Updated record'}]};
  const model={countDocuments:async value=>{filter=value;return 25},find:value=>{assert.deepEqual(value,filter);return chain}};
  const res=response();
  await createActivityListHandler(model)({headers:header({...staff,role:'Admin'}),query:{search:'staff.*',page:'2',from:'2026-10-24',to:'2026-10-24'}},res);
  assert.equal(res.statusCode,200);
  assert.equal(filter.$or[0].staffName.$regex,'staff\\.\\*');
  assert.equal(filter.createdAt.$gte.toISOString(),'2026-10-23T16:00:00.000Z');
  assert.equal(res.data.pages,2);assert.equal(res.data.logs.length,1);
});
