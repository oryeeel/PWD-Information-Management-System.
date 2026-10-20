const {test} = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('esbuild');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const {MemoryRouter} = require('react-router-dom');

test('Add Record renders with all four ID card details required', async () => {
  const result = await esbuild.build({
    entryPoints:[path.resolve(__dirname,'../src/pages/AddRecord.jsx')],
    bundle:true, platform:'node', format:'cjs', packages:'external', write:false,
  });
  const compiled = new Module(__filename,module);
  compiled.filename = __filename;
  compiled.paths = module.paths;
  compiled._compile(result.outputFiles[0].text,__filename);
  const html = renderToStaticMarkup(React.createElement(MemoryRouter,null,React.createElement(compiled.exports.default)));
  assert.ok(html.includes('Add New Record'));
  for (const label of ['Civil Status','Blood Type','Emergency Contact Name','Emergency Contact Number']) {
    const start = html.indexOf('<label>'+label);
    assert.ok(start >= 0, label+' is visible');
    const field = html.slice(start).split('</label>')[0];
    assert.ok(field.includes('required=""'),label+' is required');
  }
});
