#!/usr/bin/env node

import { spawnSync } from 'child_process';

function log(message) {
  process.stdout.write(`${message}\n`);
}

function error(message) {
  process.stderr.write(`${message}\n`);
}

function parsePort(value) {
  const port = Number.parseInt(String(value || ''), 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return null;
  }
  return port;
}

function getListeningPidsWindows(port) {
  const result = spawnSync('netstat', ['-ano', '-p', 'tcp'], {
    encoding: 'utf8',
    shell: true,
  });

  if (result.error) {
    throw result.error;
  }

  const stdout = result.stdout || '';
  const lines = stdout.split(/\r?\n/);
  const pids = new Set();

  for (const line of lines) {
    const match = line.match(/^\s*TCP\s+\S+:(\d+)\s+\S+\s+LISTENING\s+(\d+)\s*$/i);
    if (!match) {
      continue;
    }

    const linePort = Number.parseInt(match[1], 10);
    const pid = Number.parseInt(match[2], 10);

    if (linePort === port && Number.isInteger(pid) && pid > 0) {
      pids.add(pid);
    }
  }

  return [...pids];
}

function getListeningPidsUnix(port) {
  const result = spawnSync('lsof', ['-ti', `tcp:${port}`, '-sTCP:LISTEN'], {
    encoding: 'utf8',
  });

  // lsof exits with code 1 when nothing is listening, which is fine.
  if (result.error) {
    throw result.error;
  }

  const stdout = (result.stdout || '').trim();
  if (!stdout) {
    return [];
  }

  const pids = stdout
    .split(/\r?\n/)
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((pid) => Number.isInteger(pid) && pid > 0);

  return [...new Set(pids)];
}

function killPidWindows(pid) {
  const result = spawnSync('taskkill', ['/PID', String(pid), '/F'], {
    encoding: 'utf8',
    shell: true,
  });

  if (result.error) {
    throw result.error;
  }

  // taskkill can return non-zero when process already exited.
  if (result.status !== 0) {
    const details = (result.stderr || result.stdout || '').trim();
    throw new Error(details || `Failed to stop PID ${pid}`);
  }
}

function killPidUnix(pid) {
  const result = spawnSync('kill', ['-9', String(pid)], {
    encoding: 'utf8',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const details = (result.stderr || result.stdout || '').trim();
    throw new Error(details || `Failed to stop PID ${pid}`);
  }
}

function main() {
  const port = parsePort(process.argv[2]);

  if (!port) {
    error('Usage: node scripts/close-port.js <port>');
    process.exit(1);
  }

  const isWindows = process.platform === 'win32';

  let pids;
  try {
    pids = isWindows
      ? getListeningPidsWindows(port)
      : getListeningPidsUnix(port);
  } catch (err) {
    error(`[close-port] Failed to detect listeners on port ${port}: ${err.message}`);
    process.exit(1);
  }

  if (!pids.length) {
    log(`[close-port] Port ${port} is already free.`);
    return;
  }

  log(`[close-port] Found listeners on port ${port}: ${pids.join(', ')}`);

  const failed = [];

  for (const pid of pids) {
    try {
      if (isWindows) {
        killPidWindows(pid);
      } else {
        killPidUnix(pid);
      }
      log(`[close-port] Stopped PID ${pid}.`);
    } catch (err) {
      failed.push({ pid, message: err.message });
    }
  }

  if (failed.length) {
    for (const item of failed) {
      error(`[close-port] Failed to stop PID ${item.pid}: ${item.message}`);
    }
    process.exit(1);
  }

  log(`[close-port] Port ${port} is ready.`);
}

main();
