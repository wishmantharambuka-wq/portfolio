#!/usr/bin/env node
/**
 * Generate a PBKDF2 hash for the admin password.
 *
 *   npm run set-admin-password
 *   npm run set-admin-password -- "my long passphrase"
 *
 * Writes VITE_ADMIN_PW_SALT / VITE_ADMIN_PW_HASH into .env.local (gitignored),
 * so the password itself never enters the repo or the JS bundle — only a hash
 * that is expensive to reverse.
 *
 * Must stay in lockstep with deriveHash() in src/lib/adminAuth.ts:
 * PBKDF2-SHA-256, 600,000 iterations, 256-bit output, base64.
 */
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createInterface } from 'node:readline';

const ITERATIONS = 600_000;
const KEY_BYTES = 32;
const ENV_FILE = '.env.local';

function derive(password, saltB64) {
  const salt = Buffer.from(saltB64, 'base64');
  return pbkdf2Sync(password, salt, ITERATIONS, KEY_BYTES, 'sha256').toString('base64');
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (a) => (rl.close(), resolve(a))));
}

/** Replace or append a KEY=value line, leaving the rest of the file intact. */
function upsert(text, key, value) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  return re.test(text) ? text.replace(re, line) : `${text}${text.endsWith('\n') || text === '' ? '' : '\n'}${line}\n`;
}

const problems = (pw) => {
  const out = [];
  if (pw.length < 12) out.push('shorter than 12 characters');
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw)) out.push('no mix of upper and lower case');
  if (!/[0-9]/.test(pw)) out.push('no digit');
  if (/^(admin|password|portfolio|chamod)/i.test(pw)) out.push('starts with an obvious word');
  return out;
};

const password = process.argv[2] ?? (await ask('New admin password: '));

if (!password || password.trim().length === 0) {
  console.error('\n✖ No password given. Nothing changed.');
  process.exit(1);
}

const weak = problems(password);
if (weak.length) {
  console.log(`\n⚠  Weak password: ${weak.join(', ')}.`);
  const go = await ask('   Use it anyway? [y/N] ');
  if (!/^y(es)?$/i.test(go.trim())) {
    console.log('\nNothing changed. Try a longer passphrase — length beats symbols.');
    process.exit(1);
  }
}

const saltB64 = randomBytes(16).toString('base64');
process.stdout.write(`\nDeriving (${ITERATIONS.toLocaleString()} iterations)… `);
const hashB64 = derive(password, saltB64);
console.log('done.');

let text = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8') : '';
text = upsert(text, 'VITE_ADMIN_PW_SALT', saltB64);
text = upsert(text, 'VITE_ADMIN_PW_HASH', hashB64);
writeFileSync(ENV_FILE, text, 'utf8');

console.log(`
✔ Saved to ${ENV_FILE} (gitignored — the password is not in your repo).

  VITE_ADMIN_PW_SALT=${saltB64}
  VITE_ADMIN_PW_HASH=${hashB64}

Next:
  • Restart the dev server so Vite picks up the new values.
  • The admin panel is dev-only by default. To also enable it on the deployed
    site, add VITE_ENABLE_ADMIN=true plus the two values above in your host's
    environment variables — but read the warning in src/lib/adminAuth.ts first:
    a browser-checked password is deterrence, not protection.
`);
