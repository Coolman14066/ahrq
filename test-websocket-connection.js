import io from 'socket.io-client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env' });

const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:3002';

console.log('=== WebSocket Connection Test ===');
console.log(`Testing connection to: ${BACKEND_URL}`);
console.log('');

const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 3,
  reconnectionDelay: 1000,
  timeout: 10000,
});

let connectionTimeout = setTimeout(() => {
  console.error('❌ Connection timeout - unable to connect to backend');
  console.log('\nPossible issues:');
  console.log('1. Backend server is not running (run: cd backend && npm start)');
  console.log('2. Backend is running on a different port');
  console.log('3. Firewall or network issues');
  process.exit(1);
}, 15000);

socket.on('connect', () => {
  clearTimeout(connectionTimeout);
  console.log('✅ Successfully connected to WebSocket server');
  console.log(`   Socket ID: ${socket.id}`);
  console.log('');
  
  // Test sending a message
  console.log('Testing chat message...');
  socket.emit('chat:message', {
    message: 'Test message from connection test script',
    context: { view: 'test' },
    sessionId: 'test-session-' + Date.now()
  });
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  console.log(`   Error type: ${error.type}`);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});

socket.on('chat:response', (response) => {
  console.log('✅ Received chat response:');
  console.log(`   Message: ${response.message}`);
  console.log(`   Has actions: ${response.actions ? 'Yes' : 'No'}`);
  console.log('');
  console.log('🎉 WebSocket connection test completed successfully!');
  process.exit(0);
});

socket.on('chat:error', (error) => {
  console.error('❌ Chat error:', error);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\nClosing connection...');
  socket.disconnect();
  process.exit(0);
});