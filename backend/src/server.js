import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import rateLimit from 'express-rate-limit';

// Import services
import { ChatbotService } from './services/chatbotService.js';
import { DataQueryEngine } from './services/dataQueryEngine.js';
import { InsightsEngine } from './services/insightsEngine.js';

// Import route factories
import createChatRoutes from './routes/chatRoutes.js';
import createDataRoutes from './routes/dataRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

// Import logger
import { logger, requestLogger, wsLogger } from './utils/logger.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const startTime = Date.now();
logger.info('Starting server initialization...');

// Validate required environment variables
const requiredEnvVars = ['OPENROUTER_API_KEY', 'PORT'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  logger.error('Missing required environment variables:', missingEnvVars.join(', '));
  logger.error('Please check your .env file');
  process.exit(1);
}

// Log loaded configuration (without sensitive data)
logger.info('Configuration loaded:', {
  PORT: process.env.PORT,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? '***' + process.env.OPENROUTER_API_KEY.slice(-4) : 'NOT SET',
  DEBUG_MODE: process.env.DEBUG_MODE || 'false',
  VERBOSE_LOGGING: process.env.VERBOSE_LOGGING || 'false'
});

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/', limiter);

// Request logging middleware
app.use(requestLogger);

// Services initialization status
let servicesReady = false;
let initializationError = null;

// Initialize services (but don't wait)
logger.info('Creating service instances...');
const chatbotService = new ChatbotService();
const dataQueryEngine = new DataQueryEngine();
const insightsEngine = new InsightsEngine();

// Initialize services asynchronously after server starts
const initializeServices = async () => {
  const serviceStartTime = Date.now();
  logger.info('Starting async service initialization...');
  
  try {
    // Initialize services in parallel where possible
    await Promise.all([
      chatbotService.initialize(),
      dataQueryEngine.initialize()
    ]);
    
    servicesReady = true;
    logger.info(`All services initialized in ${Date.now() - serviceStartTime}ms`);
  } catch (error) {
    logger.error('Service initialization failed:', error);
    initializationError = error;
  }
};

// Initialize routes with services
logger.info('Setting up routes...');
const chatRoutes = createChatRoutes(chatbotService);
const dataRoutes = createDataRoutes(dataQueryEngine, insightsEngine);

// Mount routes
app.use('/api/chat', chatRoutes);
app.use('/api/data', dataRoutes);

// Basic health check - responds immediately
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    ready: servicesReady,
    uptime: Date.now() - startTime
  });
});

// Detailed readiness check
app.get('/api/ready', (req, res) => {
  if (!servicesReady) {
    res.status(503).json({
      status: 'initializing',
      ready: false,
      error: initializationError ? initializationError.message : null
    });
    return;
  }
  
  res.json({ 
    status: 'ready', 
    ready: true,
    timestamp: new Date().toISOString(),
    services: {
      openrouter: chatbotService.isConnected(),
      socketio: io.engine.clientsCount,
      dataLoaded: dataQueryEngine.data?.length || 0,
      chatbotInitialized: chatbotService.isInitialized,
      dataEngineInitialized: dataQueryEngine.isInitialized
    }
  });
});

// Test endpoint
app.post('/api/test', (req, res) => {
  console.log('[TEST] Test endpoint hit');
  res.json({ message: 'Test endpoint working', body: req.body });
});

// Socket.io connection for real-time communication
io.on('connection', (socket) => {
  console.log('[SOCKET] Client connected:', socket.id);
  
  // Handle dashboard context updates
  socket.on('context:update', async (data) => {
    console.log('[SOCKET] Received context update from:', socket.id);
    try {
      const result = await chatbotService.updateContext(socket.id, data.context);
      socket.emit('context:acknowledged', { success: true, ...result });
    } catch (error) {
      console.error('[SOCKET] Context update error:', error);
      socket.emit('context:error', { error: error.message });
    }
  });
  
  // Handle chat messages
  socket.on('chat:message', async (data) => {
    console.log('[SOCKET] Received chat message from:', socket.id, 'Message:', data.message);
    try {
      const response = await chatbotService.processMessage(
        data.message,
        data.context,
        data.visualContext,
        data.sessionId || socket.id
      );
      
      console.log('[SOCKET] Sending response to:', socket.id);
      socket.emit('chat:response', response);
    } catch (error) {
      console.error('[SOCKET] Chat processing error:', error);
      socket.emit('chat:error', { error: error.message });
    }
  });
  
  // Handle dashboard actions
  socket.on('action:execute', async (action) => {
    console.log('[SOCKET] Received action request from:', socket.id, 'Action:', action);
    try {
      const result = await chatbotService.executeAction(action, socket.id);
      socket.emit('action:result', result);
    } catch (error) {
      console.error('[SOCKET] Action execution error:', error);
      socket.emit('action:error', { error: error.message });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('[SOCKET] Client disconnected:', socket.id);
    chatbotService.cleanupSession(socket.id);
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`[404] Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'Route not found', 
    path: req.path,
    method: req.method,
    message: 'The requested endpoint does not exist. Check the API documentation.'
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3002;

httpServer.listen(PORT, () => {
  console.log(`[SERVER] HTTP server listening on port ${PORT} in ${Date.now() - startTime}ms`);
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║          AHRQ AI Backend Server Started            ║');
  console.log('╠════════════════════════════════════════════════════╣');
  console.log(`║ Server Port: ${PORT.toString().padEnd(38)}║`);
  console.log(`║ Frontend URL: ${(process.env.FRONTEND_URL || 'http://localhost:3000').padEnd(37)}║`);
  console.log('╠════════════════════════════════════════════════════╣');
  console.log('║ Available Endpoints:                               ║');
  console.log('║   GET  /api/health  (immediate response)           ║');
  console.log('║   GET  /api/ready   (service readiness)            ║');
  console.log('║   POST /api/chat/message                           ║');
  console.log('║   POST /api/chat/context                           ║');
  console.log('║   POST /api/chat/action                            ║');
  console.log('║   GET  /api/data/stats                             ║');
  console.log('║   GET  /api/data/query                             ║');
  console.log('║   POST /api/data/query                             ║');
  console.log('╚════════════════════════════════════════════════════╝');
  
  // Start service initialization after server is listening
  initializeServices();
});

httpServer.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`[SERVER] Port ${PORT} is already in use`);
    console.error('[SERVER] Please check if another instance is running');
    console.error('[SERVER] You can kill it with: lsof -ti:3002 | xargs kill -9');
    process.exit(1);
  } else {
    console.error('[SERVER] Server error:', error);
    process.exit(1);
  }
});