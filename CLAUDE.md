# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev:full` - Start both frontend (port 3000) and backend (port 3002) with proper health checks
- `npm run dev` - Start frontend only (requires backend running separately)
- `npm run dev:backend` - Start backend only
- `npm run build` - Build frontend for production

### Code Quality
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint on TypeScript files
- `npm run check-imports` - Verify import paths are correct

### Testing
- Backend: `cd backend && npm test` (Jest tests)
- API testing: `cd backend && npm run test-api`
- Manual testing scripts in root: `test-*.js` files

## Architecture

### Frontend (React + TypeScript)
The frontend is a data visualization dashboard built with:
- **Entry**: `src/main.tsx` → `src/AHRQDashboard.tsx`
- **State Management**: React hooks and context (no Redux)
- **Data Flow**: CSV parsed on client-side via PapaParse, WebSocket for real-time AI chat
- **Routing**: Single-page app with tab-based navigation in main dashboard

Key visualization components:
- `NetworkGraph.tsx` - D3 force-directed graph for author collaborations
- `SankeyDiagram.tsx` - D3 Sankey diagram for research impact flow
- `AIInsights.tsx` - Chat interface with streaming responses via WebSocket

### Backend (Node.js + Express)
The backend provides AI chat functionality:
- **Entry**: `backend/src/server.js`
- **API**: REST endpoints at `/api/*` and WebSocket at `/socket.io`
- **AI Integration**: OpenAI API via OpenRouter for chat completions
- **Data**: Loads CSV data into memory for context-aware responses

### Data Pipeline (Python)
Separate Python scripts in `ahrq_project/` for:
- Scopus API data collection (`01_search_scripts/`)
- Data processing and analysis (`03_analysis_scripts/`)
- Results generation (`04_results/`)

## Key Files

### Configuration
- `vite.config.ts` - Proxies `/api` and `/socket.io` to backend port 3002
- `tsconfig.json` - Path aliases configured (e.g., `@/` → `src/`)
- `.env` files - API keys and configuration (both root and backend)

### Data
- `public/ahrq_reference_good.csv` - Main dataset with 146 research papers
- `backend/src/knowledge/*.json` - Structured data for AI context

### Types
- `src/types/publication.ts` - Core data models
- `src/types/network.ts` - Network graph types
- `src/types/sankey.ts` - Sankey diagram types

## Development Workflow

1. Always run `npm run dev:full` to start full stack
2. Frontend auto-reloads with Vite HMR
3. Backend auto-reloads with nodemon
4. Check browser console for WebSocket connection status
5. Red banner appears if backend connection fails

## Important Patterns

### Error Handling
- Frontend shows user-friendly error banners
- Backend returns structured error responses
- WebSocket falls back to REST API on failure

### Data Processing
- CSV parsing happens client-side for performance
- Network and Sankey data computed on-demand
- AI responses streamed via WebSocket chunks

### Component Structure
- Visualization components are self-contained with their own data processing
- Shared UI components in `src/components/ui/`
- Hooks for common logic in `src/hooks/`

## Common Issues

1. **Port conflicts**: Kill processes on 3000/3002 before starting
2. **Backend not connecting**: Check `.env` files and API keys
3. **TypeScript errors**: Run `npm run typecheck` before committing
4. **Import errors**: Use `npm run check-imports` to verify paths

## Component Dependency Map

### Core Dependencies
```
App.tsx
└── ErrorBoundary
    └── AHRQDashboard.tsx
        ├── ChatContextProvider (global state)
        │   ├── All view components
        │   └── ChatbotWidget
        ├── Custom Hooks
        │   ├── usePublicationData (data loading)
        │   ├── usePublicationFilters (filter state)
        │   └── useComputedMetrics (derived state)
        └── View Components
            ├── PremiumOverview (523 lines - main dashboard)
            ├── ExplorerView (411 lines - publication table)
            ├── TrendsView (temporal analysis)
            ├── DomainsView (331 lines - domain analysis)
            ├── MethodologyView (371 lines - docs)
            └── GapsView (research gaps)
```

### Large Components (>300 lines - refactor candidates)
- `SankeyDiagram.tsx` (548 lines) - Complex D3 visualization
- `PremiumOverview.tsx` (523 lines) - Main dashboard view
- `PremiumCharts.tsx` (514 lines) - Chart collection
- `NetworkGraph.tsx` (431 lines) - Network visualization
- `ExplorerView.tsx` (411 lines) - Publication explorer

### State Flow
```
CSV File → usePublicationData → AHRQDashboard → ChatContext → Components
                ↓                      ↓
        Backend (via API)    View Components & Filters
```

## Debugging Guide

### WebSocket Connection Issues
1. **Check connection status**: Look for `BackendConnectionStatus` component banner
2. **Verify backend is running**: `curl http://localhost:3002/api/health`
3. **Check browser console**: Look for Socket.IO connection logs
4. **Common errors**:
   - `CORS error`: Backend FRONTEND_URL env var doesn't match
   - `Connection refused`: Backend not running or wrong port
   - `Timeout`: Backend services still initializing

### API Debugging
1. **Enable verbose logging**: Set `VERBOSE_LOGGING=true` in backend `.env`
2. **Check request/response**: Browser DevTools Network tab
3. **Backend logs**: Look for `[ChatbotService]`, `[DataQueryEngine]` prefixes
4. **Common API errors**:
   - `401 Unauthorized`: Missing or invalid OPENROUTER_API_KEY
   - `500 Server Error`: Check backend console for stack trace
   - `Data not loaded`: CSV parsing failed, check data format

### State Management Debugging
1. **React DevTools**: Install extension to inspect component state
2. **ChatContext state**: Access via `window.__ahrqChatbotUpdateContext`
3. **Filter synchronization**: Check filter transformation in `AHRQDashboard.tsx` lines 77-85
4. **Common state issues**:
   - Filters not applying: Check usage type mapping (PRIMARY_ANALYSIS vs Primary Analysis)
   - View not updating: Verify ChatContext is propagating changes
   - Data not loading: Check `usePublicationData` hook error state

### Performance Debugging
1. **React Profiler**: Use DevTools Profiler to find slow renders
2. **Large lists**: Check if virtual scrolling needed (>100 items)
3. **Memory usage**: Monitor browser memory in Task Manager
4. **Common performance issues**:
   - Sankey/Network graphs slow: Too many nodes/links
   - Explorer view lag: Missing pagination or virtualization
   - Memory leaks: Check event listener cleanup in useEffect

### Development Tips
1. **Hot Module Replacement (HMR)**: If not working, check Vite config
2. **Type errors**: Enable `strict: true` in tsconfig.json for better catches
3. **Import aliases**: Use `@/` prefix for src imports
4. **Environment variables**: 
   - Frontend: Must prefix with `VITE_`
   - Backend: Standard `process.env`
5. **Quick component testing**: Use browser console to trigger functions

## Error Recovery Patterns

### Frontend Error Boundaries
- Wrap risky components with `ErrorBoundary`
- Provide fallback UI for better UX
- Log errors to console in development

### Backend Error Handling
- All routes wrapped with try-catch
- Structured error responses with status codes
- Graceful degradation for missing services

### WebSocket Fallback
- Automatically falls back to REST API if WebSocket fails
- Retry logic with exponential backoff
- Connection status indicator for users