import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, generateTotpSecret, totpCode, verifyTotp } from '../src/utils/passwords.js';
import { createOpaqueToken, hashToken } from '../src/utils/crypto.js';

test('password hashes are salted and verify only the correct password', async () => {
  const first = await hashPassword('A long passphrase for ComplyTrack!');
  const second = await hashPassword('A long passphrase for ComplyTrack!');
  assert.notEqual(first, second);
  assert.equal(await verifyPassword('A long passphrase for ComplyTrack!', first), true);
  assert.equal(await verifyPassword('wrong password', first), false);
});

test('TOTP codes verify against the generated secret', () => {
  const secret = generateTotpSecret();
  const code = totpCode(secret);
  assert.equal(verifyTotp(code, secret), true);
  assert.equal(verifyTotp('not-a-code', secret), false);
});

test('opaque tokens are random and stored as hashes', () => {
  const token = createOpaqueToken();
  assert.ok(token.length >= 40);
  assert.notEqual(hashToken(token), token);
  assert.equal(hashToken(token), hashToken(token));
});
