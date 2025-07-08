#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const { createConnection } = require('net');
const { promisify } = require('util');
const execAsync = promisify(exec);

const BACKEND_PORT = 3002;
const FRONTEND_PORT = 3000;
const MAX_RETRIES = 30;
const RETRY_DELAY = 1000; // 1 second

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}[DEV-STARTUP] ${message}${colors.reset}`);
}

function checkPort(port) {
  return new Promise((resolve) => {
    const client = createConnection({ port }, () => {
      client.end();
      resolve(true);
    });
    client.on('error', () => {
      resolve(false);
    });
  });
}

async function waitForBackend(retries = MAX_RETRIES) {
  log(`Waiting for backend to be ready on port ${BACKEND_PORT}...`, colors.yellow);
  
  // First wait for port to be open
  let portOpen = false;
  for (let i = 0; i < 10; i++) {
    if (await checkPort(BACKEND_PORT)) {
      portOpen = true;
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  if (!portOpen) {
    log('Backend port not opening, may still be starting...', colors.yellow);
  }
  
  // Then check health endpoint
  for (let i = 0; i < retries; i++) {
    try {
      // Check basic health endpoint first
      const healthResponse = await fetch(`http://localhost:${BACKEND_PORT}/api/health`);
      if (healthResponse.ok) {
        const health = await healthResponse.json();
        log(`Backend is responding! Status: ${health.status}`, colors.green);
        
        // Now check if services are ready
        const readyResponse = await fetch(`http://localhost:${BACKEND_PORT}/api/ready`);
        if (readyResponse.ok) {
          const ready = await readyResponse.json();
          if (ready.ready) {
            log(`Backend services are ready! Data loaded: ${ready.services?.dataLoaded || 0} publications`, colors.green);
            return true;
          }
        }
        
        // Backend is responding but services not ready yet
        process.stdout.write(`\r${colors.yellow}[DEV-STARTUP] Backend responding, services initializing... (${i + 1}/${retries})${colors.reset}`);
      }
    } catch (e) {
      // Server not ready yet
      process.stdout.write(`\r${colors.yellow}[DEV-STARTUP] Waiting for backend... (${i + 1}/${retries})${colors.reset}`);
    }
    
    if (i < retries - 1) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
  
  // Check if backend is at least responding to health checks
  try {
    const response = await fetch(`http://localhost:${BACKEND_PORT}/api/health`);
    if (response.ok) {
      log('\\nBackend is responding but services may still be initializing', colors.yellow);
      log('The application should work, but some features may take a moment to become available', colors.yellow);
      return true;
    }
  } catch (e) {
    // Final check failed
  }
  
  return false;
}

async function checkBackendHealth() {
  try {
    // First check basic health
    const healthResponse = await fetch(`http://localhost:${BACKEND_PORT}/api/health`);
    if (!healthResponse.ok) {
      return { healthy: false };
    }
    
    // Then check if services are ready
    const readyResponse = await fetch(`http://localhost:${BACKEND_PORT}/api/ready`);
    if (readyResponse.ok) {
      const ready = await readyResponse.json();
      if (ready.ready) {
        return { healthy: true, data: ready };
      }
    }
    
    // Backend is running but services not ready
    return { healthy: true, data: { status: 'initializing' } };
  } catch (error) {
    return { healthy: false };
  }
}

async function killPort(port) {
  try {
    // Try lsof first (Linux/Mac)
    await execAsync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`);
  } catch (e) {
    // If lsof fails, try netstat (Windows/WSL)
    try {
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      const lines = stdout.split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid)) {
          await execAsync(`taskkill /PID ${pid} /F 2>/dev/null || true`);
        }
      }
    } catch (e) {
      // Port might already be free
    }
  }
}

async function startDevelopment() {
  log('Starting AHRQ Dashboard Development Environment', colors.bright + colors.cyan);
  log('=' + '='.repeat(50), colors.cyan);
  
  // Check if backend is already running and healthy
  log('Checking backend status...', colors.yellow);
  const backendHealthCheck = await checkBackendHealth();
  
  let skipBackendStart = false;
  if (backendHealthCheck.healthy) {
    log('Found healthy backend already running!', colors.green);
    log(`Backend health: ${JSON.stringify(backendHealthCheck.data)}`, colors.green);
    skipBackendStart = true;
  } else {
    // Only kill backend port if it's not healthy
    const backendInUse = await checkPort(BACKEND_PORT);
    if (backendInUse) {
      log('Found unhealthy backend, cleaning up...', colors.yellow);
      await killPort(BACKEND_PORT);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Always clean frontend port to ensure fresh start
  log('Preparing frontend port...', colors.yellow);
  await killPort(FRONTEND_PORT);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  let backend = null;
  
  if (!skipBackendStart) {
    // Start backend
    log('Starting backend server...', colors.blue);
    backend = spawn('npm', ['run', 'dev'], {
      cwd: './backend',
      stdio: ['inherit', 'inherit', 'inherit'],
      shell: true
    });
    
    backend.on('error', (err) => {
      log(`Failed to start backend: ${err.message}`, colors.red);
      process.exit(1);
    });
    
    // Wait for backend to be ready
    const backendReady = await waitForBackend();
    
    if (!backendReady) {
      log('Backend failed to start within timeout period!', colors.red);
      log('Please check the backend logs for errors.', colors.red);
      backend.kill();
      process.exit(1);
    }
  } else {
    log('Using existing backend instance', colors.green);
  }
  
  // Start frontend
  log('Starting frontend...', colors.blue);
  const frontend = spawn('npm', ['run', 'dev'], {
    stdio: ['inherit', 'inherit', 'inherit'],
    shell: true
  });
  
  frontend.on('error', (err) => {
    log(`Failed to start frontend: ${err.message}`, colors.red);
    backend.kill();
    process.exit(1);
  });
  
  // Handle process termination
  const cleanup = () => {
    log('\nShutting down development environment...', colors.yellow);
    frontend.kill();
    if (backend && !skipBackendStart) {
      log('Stopping backend...', colors.yellow);
      backend.kill();
    } else {
      log('Keeping backend running (it was already running)', colors.green);
    }
    process.exit(0);
  };
  
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  
  log('=' + '='.repeat(50), colors.green);
  log('Development environment is ready!', colors.bright + colors.green);
  log(`Frontend: http://localhost:${FRONTEND_PORT}`, colors.green);
  log(`Backend:  http://localhost:${BACKEND_PORT}`, colors.green);
  log(`Backend Health: http://localhost:${BACKEND_PORT}/api/health`, colors.green);
  log('=' + '='.repeat(50), colors.green);
}

// Run the startup
startDevelopment().catch((err) => {
  log(`Startup failed: ${err.message}`, colors.red);
  process.exit(1);
});