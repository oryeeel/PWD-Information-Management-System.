const {test} = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('esbuild');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');

test('summary report includes all 503 records by default, including the three older records',async()=>{
  const fixtures=Array.from({length:503},(_,index)=>({pwdId:`PWD-${index}`,createdAt:index<3?'2020-01-01T00:00:00Z':new Date().toISOString(),disabilityType:'Physical Disability',barangay:'Balacanas'}));
  const result=await esbuild.build({entryPoints:[path.resolve(__dirname,'../src/pages/Reports.jsx')],bundle:true,platform:'node',format:'cjs',packages:'external',write:false,
    plugins:[{name:'records-fixture',setup(build){
      build.onResolve({filter:/utils\/recordsApi$/},()=>({path:'records-fixture',namespace:'fixture'}));
      build.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:`export function useRecords(){return {records:${JSON.stringify(fixtures)},error:''}}`,loader:'js'}));
    }}]});
  const compiled=new Module(__filename,module);compiled.filename=__filename;compiled.paths=module.paths;
  compiled._compile(result.outputFiles[0].text,__filename);
  const html=renderToStaticMarkup(React.createElement(compiled.exports.default));
  assert.match(html,/All dates/);
  assert.match(html,/Total Records:<\/strong>\s*503/);
  assert.match(html,/Physical Disability: 503 records/);
});
