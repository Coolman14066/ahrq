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