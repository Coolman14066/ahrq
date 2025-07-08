# AI Chatbot Troubleshooting Guide

## Issue: Messages Disappearing Without Response

### Diagnosis Steps

1. **Check Backend Server Status**
   - Open terminal and navigate to the backend directory: `cd backend`
   - Ensure the backend is running: `npm run dev`
   - You should see: `[Server] AI Backend server running on port 3001`

2. **Check Browser Console**
   - Open your browser's Developer Tools (F12)
   - Go to the Console tab
   - Look for messages like:
     - `[useAIChat] Initializing Socket.IO connection to: http://localhost:3001`
     - `[useAIChat] Connected to AI backend`
     - Any error messages

3. **Check Connection Status**
   - Look at the chatbot header - you should see a green WiFi icon if connected
   - A red WiFi icon means the connection failed

### Common Issues and Solutions

#### 1. Backend Not Running
**Symptoms**: Red WiFi icon, connection errors in console

**Solution**:
```bash
cd backend
npm install  # If first time
npm run dev
```

#### 2. Port Conflict
**Symptoms**: Backend fails to start with "port already in use" error

**Solution**:
```bash
# Find process using port 3001
lsof -i :3001  # Mac/Linux
netstat -ano | findstr :3001  # Windows

# Kill the process or use a different port
# Change port in backend/.env: PORT=3002
# And update frontend .env: VITE_BACKEND_URL=http://localhost:3002
```

#### 3. CORS Issues
**Symptoms**: Console shows CORS errors

**Solution**:
- Ensure frontend is running on http://localhost:5173
- Or update `FRONTEND_URL` in backend/.env to match your frontend URL

#### 4. API Key Issues
**Symptoms**: Messages show but no AI response, errors in backend console

**Solution**:
- Check backend console for OpenRouter API errors
- Verify API key in backend/.env is correct
- The provided key should work, but may have rate limits

#### 5. Network/Firewall Issues
**Symptoms**: Cannot connect to backend

**Solution**:
- Check if firewall is blocking port 3001
- Try disabling firewall temporarily
- Ensure both frontend and backend are on same network

### Debugging Commands

1. **Test Backend Health**:
```bash
curl http://localhost:3001/api/health
```

2. **Test Direct API Call**:
```bash
curl -X POST http://localhost:3001/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "context": {}, "sessionId": "test"}'
```

3. **Check Backend Logs**:
- Backend console will show:
  - `[Server] Client connected: <socket-id>`
  - `[Server] Received chat message from: <socket-id>`
  - `[ChatbotService] Processing message...`
  - Any errors during processing

### Enhanced Logging

The updated code now includes comprehensive logging:
- Frontend console shows connection status and message flow
- Backend console shows detailed processing steps
- Connection errors are displayed in the chat UI

### Quick Fix Checklist

- [ ] Backend is running (`npm run dev` in backend folder)
- [ ] Frontend is running (`npm run dev` in root folder)
- [ ] Both are using correct ports (3001 for backend, 5173 for frontend)
- [ ] No CORS errors in browser console
- [ ] Green WiFi icon in chatbot header
- [ ] No error messages in backend console

### Issue: 404 Error on API Routes

**Symptoms**: 
- WebSocket timeout, falls back to REST API
- 404 error on `/api/chat/message`
- Console shows: `Failed to load resource: the server responded with a status of 404`

**Root Cause**: Route initialization issues with ES modules

**Solution Applied**:
1. Fixed route module exports to use factory functions
2. Properly passed service instances to routes
3. Added comprehensive logging throughout initialization

**To verify the fix**:
```bash
cd backend
npm run dev
```

Look for these startup messages:
- `[SERVER] Initializing services...`
- `[ROUTES] Creating chat routes with chatbotService: true`
- `[ROUTES] Chat routes created successfully`
- Server banner showing all available endpoints

### Diagnostic Tools

1. **Run diagnostic server**:
```bash
cd backend
npm run server-diagnostic
```
This provides detailed logging of the initialization process.

2. **Test OpenRouter API**:
```bash
cd backend
npm run test-openrouter
```
This verifies the AI API is accessible.

3. **Test backend endpoints**:
```bash
cd backend
npm run test-api
```
This tests all API endpoints directly.

### If All Else Fails

1. **Restart Everything**:
```bash
# Stop all processes (Ctrl+C)
# Terminal 1:
cd backend
npm run dev

# Terminal 2:
npm run dev
```

2. **Clear Browser Cache**:
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

3. **Check for Updates**:
```bash
# Update dependencies
npm install
cd backend && npm install
```

4. **Fallback to REST API**:
The chatbot automatically falls back to REST API if WebSocket fails. Check if messages work after a few seconds.

### Need More Help?

If issues persist, check:
1. Browser Network tab for failed requests
2. Backend terminal for detailed error messages
3. Frontend console for connection errors

The enhanced logging should provide clear indication of where the issue is occurring.