import { createConnection } from 'net';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCK_FILE = path.join(__dirname, '../../../.backend.lock');
const HEALTH_CHECK_TIMEOUT = 2000;
const MAX_TAKEOVER_ATTEMPTS = 3;

export class PortManager {
  constructor(port, apiUrl = 'http://localhost:3002') {
    this.port = port;
    this.apiUrl = apiUrl;
  }

  // Check if port is in use
  async isPortInUse() {
    return new Promise((resolve) => {
      const client = createConnection({ port: this.port }, () => {
        client.end();
        resolve(true);
      });
      
      client.on('error', () => {
        resolve(false);
      });

      // Timeout after 1 second
      setTimeout(() => {
        client.destroy();
        resolve(false);
      }, 1000);
    });
  }

  // Check backend health
  async checkHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);
      
      const response = await fetch(`${this.apiUrl}/api/health`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        return {
          healthy: true,
          data
        };
      }
      return { healthy: false, reason: 'Bad response' };
    } catch (error) {
      return { healthy: false, reason: error.message };
    }
  }

  // Read lock file
  async readLockFile() {
    try {
      const content = await fs.readFile(LOCK_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  // Write lock file
  async writeLockFile(data) {
    try {
      await fs.writeFile(LOCK_FILE, JSON.stringify({
        pid: process.pid,
        port: this.port,
        startTime: new Date().toISOString(),
        ...data
      }, null, 2));
      return true;
    } catch (error) {
      console.error('[PortManager] Failed to write lock file:', error);
      return false;
    }
  }

  // Remove lock file
  async removeLockFile() {
    try {
      await fs.unlink(LOCK_FILE);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Check if process is running
  async isProcessRunning(pid) {
    try {
      // Try to send signal 0 to check if process exists
      process.kill(pid, 0);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Kill process on port
  async killPort() {
    try {
      // Try lsof first (Linux/Mac)
      await execAsync(`lsof -ti:${this.port} | xargs kill -9 2>/dev/null || true`);
    } catch (error) {
      // If lsof fails, try netstat (Windows/WSL)
      try {
        const { stdout } = await execAsync(`netstat -ano | findstr :${this.port}`);
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

  // Main method to ensure singleton backend
  async ensureSingletonBackend() {
    console.log(`[PortManager] Checking backend status on port ${this.port}...`);
    
    const portInUse = await this.isPortInUse();
    const lockFile = await this.readLockFile();
    
    if (!portInUse) {
      console.log('[PortManager] Port is free, starting new backend instance');
      await this.removeLockFile();
      return { action: 'start', reason: 'Port is free' };
    }

    // Port is in use, check if it's our backend
    const health = await this.checkHealth();
    
    if (health.healthy) {
      console.log('[PortManager] Existing backend is healthy');
      console.log('[PortManager] Health data:', health.data);
      
      // Update lock file with current process if it's stale
      if (lockFile && lockFile.pid !== process.pid) {
        const processRunning = await this.isProcessRunning(lockFile.pid);
        if (!processRunning) {
          await this.writeLockFile({ previousPid: lockFile.pid });
        }
      }
      
      return { 
        action: 'skip', 
        reason: 'Healthy backend already running',
        health: health.data 
      };
    }

    // Port is in use but backend is unhealthy
    console.log('[PortManager] Port is in use but backend is unhealthy');
    console.log('[PortManager] Attempting graceful takeover...');
    
    // Try to kill the unhealthy process
    for (let attempt = 1; attempt <= MAX_TAKEOVER_ATTEMPTS; attempt++) {
      console.log(`[PortManager] Takeover attempt ${attempt}/${MAX_TAKEOVER_ATTEMPTS}`);
      
      await this.killPort();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for port to be released
      
      const stillInUse = await this.isPortInUse();
      if (!stillInUse) {
        console.log('[PortManager] Successfully freed port');
        await this.removeLockFile();
        return { action: 'start', reason: 'Took over from unhealthy instance' };
      }
    }
    
    // Failed to take over
    console.error('[PortManager] Failed to take over port after multiple attempts');
    return { 
      action: 'error', 
      reason: 'Port is occupied by unresponsive process',
      suggestion: 'Please manually kill the process using port ' + this.port 
    };
  }

  // Cleanup on exit
  async cleanup() {
    const lockFile = await this.readLockFile();
    if (lockFile && lockFile.pid === process.pid) {
      await this.removeLockFile();
    }
  }
}

export default PortManager;