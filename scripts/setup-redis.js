#!/usr/bin/env node
/**
 * setup-redis.js
 * ──────────────
 * Cross-platform Redis installer + starter.
 * Run with:  node ../scripts/setup-redis.js
 * Or via:    npm run redis:setup   (from server/)
 */

import { execSync, spawnSync, spawn } from 'child_process';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { setTimeout } from 'timers';

const platform = os.platform(); // 'win32' | 'darwin' | 'linux'

const log   = (msg) => console.log(`\x1b[36m[Redis Setup]\x1b[0m ${msg}`);
const ok    = (msg) => console.log(`\x1b[32m[Redis Setup] ✅ ${msg}\x1b[0m`);
const warn  = (msg) => console.log(`\x1b[33m[Redis Setup] ⚠️  ${msg}\x1b[0m`);
const error = (msg) => console.log(`\x1b[31m[Redis Setup] ❌ ${msg}\x1b[0m`);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: opts.silent ? 'pipe' : 'inherit', ...opts });
  } catch (e) {
    return null;
  }
}

function commandExists(cmd) {
  const result = spawnSync(cmd, ['--version'], { encoding: 'utf8', stdio: 'pipe' });
  return result.status === 0;
}

function redisRunning() {
  try {
    const result = execSync(
      platform === 'win32'
        ? '"C:\\Program Files\\Redis\\redis-cli.exe" ping'
        : 'redis-cli ping',
      { encoding: 'utf8', stdio: 'pipe', timeout: 3000 }
    );
    return result.trim() === 'PONG';
  } catch {
    return false;
  }
}

// ─── Platform Handlers ────────────────────────────────────────────────────────

function setupWindows() {
  log('Platform: Windows');

  // Check if already running
  if (redisRunning()) {
    ok('Redis is already running on localhost:6379');
    return;
  }

  // Check if installed via Windows Service
  const svcCheck = run('sc query Redis', { silent: true });
  if (svcCheck && svcCheck.includes('RUNNING')) {
    ok('Redis Windows Service is running');
    return;
  }

  // Check if redis-cli exists (installed but service stopped)
  const redisCli = 'C:\\Program Files\\Redis\\redis-cli.exe';
  const redisServer = 'C:\\Program Files\\Redis\\redis-server.exe';

  if (fs.existsSync(redisServer)) {
    log('Redis is installed but not running. Starting service...');
    run('net start Redis', { silent: true });
    if (!redisRunning()) {
      // Start manually if service fails
      spawn(redisServer, [], { detached: true, stdio: 'ignore' }).unref();
      setTimeout(() => {}, 1500);
    }
  } else {
    // Install via winget
    log('Redis not found. Installing via winget...');
    const winget = run('winget --version', { silent: true });
    if (!winget) {
      error('winget not found. Please install Redis manually from: https://github.com/microsoftarchive/redis/releases');
      error('Download Redis-x64-3.0.504.msi and install it, then re-run this script.');
      process.exit(1);
    }
    run('winget install --id Redis.Redis -e --accept-source-agreements --accept-package-agreements');
    log('Installed! Starting Redis service...');
    run('net start Redis', { silent: true });
  }

  // Final check
  if (redisRunning()) {
    ok('Redis is running on localhost:6379');
  } else {
    warn('Redis may need a terminal restart. Try: net start Redis (as Administrator)');
  }
}

function setupMac() {
  log('Platform: macOS');

  if (redisRunning()) {
    ok('Redis is already running on localhost:6379');
    return;
  }

  if (!commandExists('brew')) {
    error('Homebrew not found. Install it first: https://brew.sh');
    process.exit(1);
  }

  if (!commandExists('redis-cli')) {
    log('Installing Redis via Homebrew...');
    run('brew install redis');
  }

  log('Starting Redis via brew services...');
  run('brew services start redis');

  if (redisRunning()) {
    ok('Redis is running on localhost:6379');
  } else {
    error('Redis failed to start. Try: brew services restart redis');
    process.exit(1);
  }
}

function setupLinux() {
  log('Platform: Linux');

  if (redisRunning()) {
    ok('Redis is already running on localhost:6379');
    return;
  }

  // Check if redis-server exists
  if (!commandExists('redis-server')) {
    log('Installing Redis...');

    // Detect package manager
    if (commandExists('apt-get')) {
      run('sudo apt-get update -y && sudo apt-get install -y redis-server');
    } else if (commandExists('yum')) {
      run('sudo yum install -y redis');
    } else if (commandExists('dnf')) {
      run('sudo dnf install -y redis');
    } else {
      error('No supported package manager found (apt-get, yum, dnf).');
      error('Install Redis manually: https://redis.io/docs/getting-started/installation/');
      process.exit(1);
    }
  }

  log('Starting Redis service...');
  run('sudo systemctl enable redis-server 2>/dev/null || sudo systemctl enable redis 2>/dev/null');
  run('sudo systemctl start redis-server 2>/dev/null || sudo systemctl start redis 2>/dev/null');

  if (redisRunning()) {
    ok('Redis is running on localhost:6379');
  } else {
    error('Redis failed to start. Try: sudo systemctl status redis-server');
    process.exit(1);
  }
}

// ─── .env Patcher ─────────────────────────────────────────────────────────────

function patchEnv() {
  const envPath = path.join(import.meta.dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;

  let content = fs.readFileSync(envPath, 'utf8');

  // Only patch if REDIS_URL is pointing to a remote host
  if (content.includes('REDIS_URL=redis://localhost')) {
    log('.env already uses localhost Redis — no changes needed');
    return;
  }

  if (content.match(/^REDIS_URL=redis:\/\/(?!localhost)/m)) {
    warn('Remote REDIS_URL detected in .env');
    warn('For local dev, consider switching to: REDIS_URL=redis://localhost:6379');
    warn('Your current .env is unchanged.');
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

log('Checking Redis...');

switch (platform) {
  case 'win32':  setupWindows(); break;
  case 'darwin': setupMac();     break;
  case 'linux':  setupLinux();   break;
  default:
    error(`Unsupported platform: ${platform}`);
    process.exit(1);
}

patchEnv();

log('');
log('Quick Redis commands:');
log('  redis-cli ping          → should return PONG');
log('  redis-cli monitor       → watch all commands in real-time');
log('  redis-cli keys "*"      → list all cached keys');
log('  redis-cli flushall      → clear all cache (careful!)');
