#!/usr/bin/env node
/**
 * redis-cli.js  —  cross-platform Redis CLI wrapper
 * Works even when redis-cli is not on PATH (e.g., fresh Windows install)
 */

import { execSync, spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';

const platform = os.platform();
const arg      = process.argv[2] || 'ping'; // ping | start | stop | check

// ─── Find redis-cli / redis-server ───────────────────────────────────────────

function findRedisBin(bin) {
  // Windows default install path from winget / MSI
  const winPaths = [
    `C:\\Program Files\\Redis\\${bin}.exe`,
    `C:\\Program Files (x86)\\Redis\\${bin}.exe`,
    path.join(os.homedir(), `AppData\\Local\\Redis\\${bin}.exe`),
  ];

  if (platform === 'win32') {
    for (const p of winPaths) {
      try { fs.accessSync(p); return `"${p}"`; } catch {}
    }
    // Fall back to PATH (works after terminal restart)
    return bin;
  }

  // macOS / Linux — always on PATH after install
  return bin;
}

const cli    = findRedisBin('redis-cli');
const server = findRedisBin('redis-server');

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: opts.silent ? 'pipe' : 'inherit' });
  } catch (e) {
    return null;
  }
}

function isRunning() {
  try {
    const r = execSync(`${cli} ping`, { encoding: 'utf8', stdio: 'pipe', timeout: 3000 });
    return r.trim() === 'PONG';
  } catch { return false; }
}

// ─── Commands ─────────────────────────────────────────────────────────────────

switch (arg) {

  case 'ping':
    try {
      const result = execSync(`${cli} ping`, { encoding: 'utf8', stdio: 'pipe', timeout: 3000 });
      console.log(result.trim()); // PONG
    } catch (e) {
      console.error('Redis is not running. Start it with: npm run redis:start');
      process.exit(1);
    }
    break;

  case 'check':
    if (isRunning()) {
      console.log('\x1b[32m✅ Redis is running on localhost:6379\x1b[0m');
    } else {
      console.log('\x1b[31m❌ Redis is NOT running. Run: npm run redis:setup\x1b[0m');
      process.exit(1);
    }
    break;

  case 'start':
    if (isRunning()) {
      console.log('\x1b[32m✅ Redis is already running\x1b[0m');
      break;
    }
    console.log('Starting Redis...');
    if (platform === 'win32') {
      const svc = run('net start Redis', { silent: true });
      if (!isRunning()) {
        // Service failed — start the exe directly
        const serverExe = findRedisBin('redis-server');
        spawn(
          serverExe.replace(/"/g, ''), [],
          { detached: true, stdio: 'ignore' }
        ).unref();
        setTimeout(() => {
          console.log(isRunning()
            ? '\x1b[32m✅ Redis started successfully\x1b[0m'
            : '\x1b[33m⚠️  Redis may need a moment — try: npm run redis:ping\x1b[0m'
          );
        }, 1500);
      } else {
        console.log('\x1b[32m✅ Redis started successfully\x1b[0m');
      }
    } else if (platform === 'darwin') {
      run('brew services start redis');
    } else {
      run('sudo systemctl start redis-server 2>/dev/null || sudo systemctl start redis');
    }
    break;

  case 'stop':
    console.log('Stopping Redis...');
    if (platform === 'win32') {
      run('net stop Redis');
    } else if (platform === 'darwin') {
      run('brew services stop redis');
    } else {
      run('sudo systemctl stop redis-server 2>/dev/null || sudo systemctl stop redis');
    }
    console.log('\x1b[32m✅ Redis stopped\x1b[0m');
    break;

  default:
    // Pass through any other redis-cli command
    // e.g.: node redis-cli.js keys "*"
    const extra = process.argv.slice(2).join(' ');
    execSync(`${cli} ${extra}`, { stdio: 'inherit' });
}
