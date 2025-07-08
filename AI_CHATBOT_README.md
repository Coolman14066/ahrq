# AHRQ Dashboard AI Chatbot Integration

This AI chatbot integration provides an intelligent assistant for the AHRQ Research Dashboard, powered by Gemini 2.5 Flash Lite through OpenRouter.

## Features

- **Natural Language Queries**: Ask questions about publications, authors, trends, and policy impacts
- **Dashboard Navigation**: Use chat to switch between views and apply filters
- **Contextual Understanding**: AI knows what you're viewing and provides relevant insights
- **Data Analysis**: Query the CSV data using natural language
- **Action Execution**: The chatbot can control the dashboard based on your requests

## Setup Instructions

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

### 2. Start the Backend Server

```bash
cd backend
npm run dev
```

The backend will start on http://localhost:3001

### 3. Start the Frontend

In a new terminal:

```bash
npm run dev
```

The dashboard will be available at http://localhost:5173

## Usage Examples

### Data Queries
- "Show me publications by Smith"
- "What are the highest impact publications?"
- "Find papers about market competition"
- "Show trends in healthcare quality research"

### Navigation
- "Take me to the network view"
- "Show me the flow analysis"
- "Switch to trends"
- "Go to overview"

### Filtering
- "Filter to publications from 2023"
- "Show only government publications"
- "Focus on primary analysis papers"
- "Filter by healthcare affordability domain"

### Analysis
- "What patterns do you see in the data?"
- "Explain this visualization"
- "Who are the most collaborative authors?"
- "What's the policy impact distribution?"

## Architecture

### Backend (`/backend`)
- **Express.js server** with Socket.IO for real-time communication
- **OpenRouter integration** for Gemini 2.5 Flash Lite
- **Data Query Engine** for natural language to data queries
- **Context Manager** for dashboard state tracking
- **Insights Engine** for proactive analysis

### Frontend Components (`/src/components/ai`)
- **ChatbotWidget**: Main chat interface
- **ChatContext**: Dashboard state provider
- **ChatMessage**: Message display component
- **ChatSuggestions**: Quick action suggestions

### Knowledge Base (`/backend/src/knowledge`)
- **components.json**: Documentation of all dashboard components
- **dataSchema.json**: Complete data structure documentation
- **queryPatterns.json**: Natural language patterns and intents

## Configuration

### Environment Variables

Frontend (`.env`):
```
VITE_BACKEND_URL=http://localhost:3001
```

Backend (`/backend/.env`):
```
OPENROUTER_API_KEY=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
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## How It Works

1. **Context Synchronization**: The dashboard continuously syncs its state (active view, filters, visible data) with the AI backend

2. **Natural Language Processing**: User queries are parsed to understand intent (data query, navigation, filtering, etc.)

3. **Data Access**: The AI can query the CSV data directly using the Data Query Engine

4. **Action Execution**: When the AI suggests actions (like switching views), these are executed through the dashboard's handler functions

5. **Intelligent Responses**: The AI provides context-aware responses based on what the user is currently viewing

## API Endpoints

### REST API
- `POST /api/chat/message` - Send a chat message
- `POST /api/chat/context` - Update dashboard context
- `POST /api/chat/action` - Execute a dashboard action
- `GET /api/data/query` - Query data
- `GET /api/data/insights` - Get contextual insights
- `GET /api/data/stats` - Get data statistics

### WebSocket Events
- `chat:message` - Send message
- `chat:response` - Receive response
- `context:update` - Update context
- `action:execute` - Execute action

## Extending the Chatbot

### Adding New Query Patterns
Edit `/backend/src/knowledge/queryPatterns.json` to add new natural language patterns.

### Adding New Actions
1. Add action handler in `/backend/src/services/chatbotService.js`
2. Add frontend handler in dashboard component
3. Update action execution in `/src/hooks/useAIChat.ts`

### Improving Context Understanding
1. Add more context fields in `/src/components/ai/ChatContext.tsx`
2. Update system prompt in `/backend/src/services/chatbotService.js`
3. Enhance insights generation in `/backend/src/services/insightsEngine.js`

## Troubleshooting

### Connection Issues
- Ensure both frontend and backend are running
- Check that ports 3001 (backend) and 5173 (frontend) are available
- Verify WebSocket connection in browser console

### Data Query Issues
- Ensure CSV file is accessible at `/public/ahrq_reference_good.csv`
- Check data parsing in `/backend/src/services/dataQueryEngine.js`
- Verify CSV headers match expected format

### AI Response Issues
- Check OpenRouter API key is valid
- Monitor backend logs for API errors
- Ensure context is being properly synchronized

## Security Notes

- The OpenRouter API key is included for demo purposes
- In production, use environment variables and secure key management
- Implement proper authentication and rate limiting
- Sanitize user inputs before processing