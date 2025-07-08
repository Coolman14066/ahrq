import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import rateLimit from 'express-rate-limit';

console.log('[STARTUP] Loading environment variables...');
dotenv.config();

console.log('[STARTUP] Starting server initialization...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);

console.log('[STARTUP] Setting up Socket.IO...');
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

console.log('[STARTUP] Applying middleware...');
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/', limiter);

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.path}`);
  next();
});

console.log('[STARTUP] Loading services...');
let chatbotService;
try {
  const { ChatbotService } = await import('./services/chatbotService.js');
  chatbotService = new ChatbotService();
  console.log('[STARTUP] ChatbotService loaded successfully');
} catch (error) {
  console.error('[STARTUP ERROR] Failed to load ChatbotService:', error);
}

console.log('[STARTUP] Loading routes...');
try {
  const chatRoutesModule = await import('./routes/chatRoutes.js');
  const chatRoutes = chatRoutesModule.default;
  console.log('[STARTUP] Chat routes loaded, mounting at /api/chat');
  app.use('/api/chat', chatRoutes);
  
  // Log all registered routes
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      console.log(`[ROUTE] ${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const path = middleware.regexp.source.replace(/\\/g, '').replace(/\^\//g, '/').replace(/\$/, '').replace(/\(\?\(/g, '');
          console.log(`[ROUTE] ${Object.keys(handler.route.methods).join(', ').toUpperCase()} ${path}${handler.route.path}`);
        }
      });
    }
  });
} catch (error) {
  console.error('[STARTUP ERROR] Failed to load chat routes:', error);
}

try {
  const dataRoutesModule = await import('./routes/dataRoutes.js');
  const dataRoutes = dataRoutesModule.default;
  console.log('[STARTUP] Data routes loaded, mounting at /api/data');
  app.use('/api/data', dataRoutes);
} catch (error) {
  console.error('[STARTUP ERROR] Failed to load data routes:', error);
}

// Health check with detailed info
app.get('/api/health', (req, res) => {
  console.log('[HEALTH] Health check requested');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      openrouter: chatbotService?.isConnected() || false,
      socketio: io.engine.clientsCount,
      routes: {
        chat: !!app._router.stack.find(r => r.regexp && r.regexp.source.includes('chat')),
        data: !!app._router.stack.find(r => r.regexp && r.regexp.source.includes('data'))
      }
    }
  });
});

// Test endpoint
app.post('/api/test', (req, res) => {
  console.log('[TEST] Test endpoint hit');
  res.json({ message: 'Test endpoint working', body: req.body });
});

// 404 handler
app.use((req, res) => {
  console.log(`[404] Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'Route not found', 
    path: req.path,
    method: req.method,
    availableRoutes: [
      'GET /api/health',
      'POST /api/test',
      'POST /api/chat/message',
      'GET /api/data/stats'
    ]
  });
});

console.log('[STARTUP] Setting up Socket.IO handlers...');
io.on('connection', (socket) => {
  console.log('[SOCKET] Client connected:', socket.id);
  
  socket.on('chat:message', async (data) => {
    console.log('[SOCKET] Chat message received:', data.message);
    try {
      if (!chatbotService) {
        throw new Error('ChatbotService not initialized');
      }
      const response = await chatbotService.processMessage(
        data.message,
        data.context,
        data.visualContext,
        data.sessionId || socket.id
      );
      socket.emit('chat:response', response);
    } catch (error) {
      console.error('[SOCKET ERROR] Chat processing error:', error);
      socket.emit('chat:error', { error: error.message });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('[SOCKET] Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    path: req.path
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`[STARTUP COMPLETE] Server running on port ${PORT}`);
  console.log(`[STARTUP COMPLETE] Frontend expected at: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log('[STARTUP COMPLETE] Available endpoints:');
  console.log('  - GET  /api/health');
  console.log('  - POST /api/test');
  console.log('  - POST /api/chat/message');
  console.log('  - POST /api/chat/context');
  console.log('  - POST /api/chat/action');
  console.log('  - GET  /api/data/stats');
  console.log('  - GET  /api/data/query');
  console.log('  - POST /api/data/query');
});