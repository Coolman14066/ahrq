import express from 'express';
import cors from 'cors';

const app = express();

console.log('[MINIMAL] Starting minimal test server...');

// Basic middleware
app.use(cors());
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.path}`);
  next();
});

// Test endpoints
app.get('/api/health', (req, res) => {
  console.log('[ENDPOINT] Health check called');
  res.json({ status: 'ok', server: 'minimal' });
});

app.post('/api/test', (req, res) => {
  console.log('[ENDPOINT] Test endpoint called');
  res.json({ message: 'Test working', received: req.body });
});

// 404 handler
app.use((req, res) => {
  console.log(`[404] Not found: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Not found', path: req.path });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`[MINIMAL] Server running on port ${PORT}`);
  console.log('[MINIMAL] Test with: curl http://localhost:3001/api/health');
});