# AHRQ Dashboard Startup Guide

## Quick Start (Recommended)

Instead of `npm run dev`, use:

```bash
npm run dev:full
```

This will:
1. Start the backend server on port 3002
2. Wait for it to be healthy
3. Start the frontend on port 3000
4. Ensure proper connection between them

## Alternative Methods

### Option 1: Shell Script (Unix/Mac/WSL)
```bash
npm run dev:all
# or
./start-dev.sh
```

### Option 2: Manual Start
```bash
# Terminal 1 - Start backend
cd backend
npm run dev

# Terminal 2 - Start frontend (after backend is running)
npm run dev
```

## Visual Indicators

- If the backend isn't running, you'll see a **red error banner** in the top-right
- The banner includes instructions and a retry button
- Once connected, the banner disappears

## Troubleshooting

### If port 3000 or 3002 is already in use:
```bash
# Kill processes on specific ports
lsof -ti:3000 | xargs kill -9
lsof -ti:3002 | xargs kill -9
```

### Check backend health:
```bash
curl http://localhost:3002/api/health
```

## Important Notes

- The frontend now requires the backend to be running
- WebSocket connections are used for real-time chat
- Falls back to REST API if WebSocket fails
- Backend configuration is in `backend/.env`