const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');

test('health endpoint reports SQLite', async (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(),'taskflow-test-'));
  const port = 46000 + Math.floor(Math.random()*1000);
  const env = { ...process.env, PORT:String(port), DB_PATH:path.join(tempDir,'test.sqlite'), NODE_ENV:'test', SESSION_SECRET:'test-secret' };
  const child = spawn(process.execPath, [path.join(__dirname,'../src/index.js')], { env, stdio:'ignore' });
  t.after(() => { child.kill(); fs.rmSync(tempDir,{recursive:true,force:true}); });
  let response;
  for (let i=0;i<40;i++) {
    try { response=await fetch(`http://127.0.0.1:${port}/api/health`); break; }
    catch { await new Promise(r=>setTimeout(r,100)); }
  }
  assert.ok(response, 'server should start');
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{ok:true,database:'sqlite'});
});
