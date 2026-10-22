const { test } = require("node:test");
const { execFileSync } = require("node:child_process");

test("Firebase Admin and JWKS load and verify RSA keys without require(ESM) support", () => {
  execFileSync(process.execPath, ["--no-experimental-require-module", "-e", `
    const assert = require('node:assert/strict');
    const path = require('node:path');
    const { generateKeyPairSync, sign, verify } = require('node:crypto');
    assert.equal(typeof require('firebase-admin/auth').getAuth, 'function');
    require('jwks-rsa');
    const { retrieveSigningKeys } = require(path.join(path.dirname(require.resolve('jwks-rsa')), 'utils.js'));
    (async () => {
      const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
      const keys = await retrieveSigningKeys([{ ...publicKey.export({ format: 'jwk' }), kid: 'runtime-test', alg: 'RS256', use: 'sig' }]);
      assert.equal(keys.length, 1);
      assert.equal(keys[0].kid, 'runtime-test');
      const data = Buffer.from('synthetic Firebase runtime regression');
      assert.equal(verify('sha256', data, keys[0].getPublicKey(), sign('sha256', data, privateKey)), true);
    })().catch(error => { console.error(error); process.exitCode = 1; });
  `], { cwd: process.cwd(), stdio: "pipe", timeout: 15000 });
});
