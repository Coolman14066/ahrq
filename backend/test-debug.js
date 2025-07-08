import fetch from 'node-fetch';
import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

const BACKEND_URL = 'http://localhost:3001';

async function checkServerRunning() {
  console.log('🔍 Checking if server is running...');
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Headers: ${response.headers.get('content-type')}`);
    
    const text = await response.text();
    console.log(`   Response preview: ${text.substring(0, 100)}...`);
    
    // Try to parse as JSON
    try {
      const json = JSON.parse(text);
      console.log('✅ Server is running and returning JSON');
      return true;
    } catch {
      console.log('❌ Server returned non-JSON response');
      console.log('   Full response:', text);
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot connect to server:', error.message);
    return false;
  }
}

async function testRawEndpoint(path, method = 'GET', body = null) {
  console.log(`\n🔍 Testing ${method} ${path}`);
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BACKEND_URL}${path}`, options);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    
    const text = await response.text();
    console.log(`   Response length: ${text.length} chars`);
    
    if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
      console.log('   ❌ Got HTML response (likely error page)');
      console.log(`   HTML preview: ${text.substring(0, 200)}...`);
    } else {
      try {
        const json = JSON.parse(text);
        console.log('   ✅ Valid JSON response');
        console.log('   Data:', JSON.stringify(json, null, 2).substring(0, 200) + '...');
      } catch {
        console.log('   ❌ Invalid JSON:', text.substring(0, 200));
      }
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
  }
}

async function startServerAndTest() {
  console.log('🚀 Starting backend server...\n');
  
  const server = spawn('node', ['src/server.js'], {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: 'development' },
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Collect server output
  let serverOutput = '';
  server.stdout.on('data', (data) => {
    const output = data.toString();
    serverOutput += output;
    process.stdout.write(`[SERVER] ${output}`);
  });
  
  server.stderr.on('data', (data) => {
    const output = data.toString();
    serverOutput += output;
    process.stderr.write(`[SERVER ERROR] ${output}`);
  });
  
  server.on('error', (error) => {
    console.error('Failed to start server:', error);
  });
  
  // Wait for server to start
  console.log('⏳ Waiting for server to initialize...\n');
  await setTimeout(3000);
  
  // Run tests
  console.log('\n📋 Running diagnostic tests...\n');
  
  const isRunning = await checkServerRunning();
  
  if (isRunning) {
    // Test each endpoint
    await testRawEndpoint('/api/health');
    await testRawEndpoint('/api/test', 'POST', { test: 'data' });
    await testRawEndpoint('/api/chat/message', 'POST', { 
      message: 'Hello',
      context: {},
      sessionId: 'test'
    });
    await testRawEndpoint('/api/data/stats');
    await testRawEndpoint('/api/data/schema');
  } else {
    console.log('\n❌ Server is not responding properly');
    console.log('\nServer output so far:');
    console.log(serverOutput);
  }
  
  // Cleanup
  console.log('\n🛑 Stopping server...');
  server.kill();
}

// Run the diagnostic
startServerAndTest().catch(console.error);