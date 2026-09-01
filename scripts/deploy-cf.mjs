#!/usr/bin/env node
/**
 * Cloudflare Pages deployment helper for KaziCoach TZ.
 *
 * Usage:
 *   node scripts/deploy-cf.mjs              # interactive setup
 *   node scripts/deploy-cf.mjs --check      # verify prerequisites only
 *   node scripts/deploy-cf.mjs --create-kv  # create KV namespace for rate limiting
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const createKV = args.includes('--create-kv');

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { cwd: root, encoding: 'utf-8', stdio: 'pipe', ...opts }).trim();
  } catch {
    return null;
  }
}

function check(label, ok) {
  console.log(`${ok ? '✓' : '✗'} ${label}`);
  return ok;
}

console.log('═══════════════════════════════════════════════════');
console.log('  KaziCoach TZ — Cloudflare Pages Deploy Check');
console.log('═══════════════════════════════════════════════════\n');

let allGood = true;

// 1. Node version
const nodeVersion = run('node --version');
const nodeOk = nodeVersion && parseInt(nodeVersion.slice(1)) >= 20;
allGood = check(`Node.js ${nodeVersion || 'not found'} (need ≥20.19)`, nodeOk) && allGood;

// 2. npm dependencies
const nodeModules = existsSync(resolve(root, 'node_modules'));
allGood = check('node_modules installed', nodeModules) && allGood;

// 3. Build
const dist = existsSync(resolve(root, 'dist', 'index.html'));
allGood = check('dist/ exists (run npm run build first)', dist) && allGood;

// 4. Functions directory
const funcsDir = existsSync(resolve(root, 'functions'));
allGood = check('functions/ directory present', funcsDir) && allGood;

// 5. wrangler
const wrangler = run('npx wrangler --version');
allGood = check(`Wrangler ${wrangler || 'not found'}`, Boolean(wrangler)) && allGood;

// 6. Git status
const gitClean = run('git status --porcelain');
allGood = check('Git working tree clean', gitClean === '') && allGood;

// 7. Branch
const branch = run('git branch --show-current');
allGood = check(`Current branch: ${branch}`, branch === 'master' || branch === 'main') && allGood;

// 8. Remote
const remote = run('git remote get-url origin');
allGood = check(`Remote: ${remote || 'none'}`, Boolean(remote)) && allGood;

console.log('');

if (checkOnly) {
  process.exit(allGood ? 0 : 1);
}

// KV creation
if (createKV) {
  console.log('── Creating KV namespace for rate limiting ──\n');
  const output = run('npx wrangler kv namespace create RATE_LIMIT_KV');
  if (output) {
    console.log(output);
    console.log('\n✓ KV namespace created. Add the binding in Cloudflare dashboard:');
    console.log('  Settings → Functions → KV namespace bindings → Add binding');
    console.log('  Variable name: RATE_LIMIT_KV');
    console.log('  KV namespace: select the one just created\n');
  } else {
    console.log('✗ Failed to create KV namespace. Make sure Wrangler is authenticated:');
    console.log('  npx wrangler login\n');
  }
}

// Summary
console.log('═══════════════════════════════════════════════════');
console.log(allGood ? '✓ All checks passed — ready to deploy' : '✗ Some checks failed — fix above issues');
console.log('═══════════════════════════════════════════════════\n');

if (!allGood) process.exit(1);
