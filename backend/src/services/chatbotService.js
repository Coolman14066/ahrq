import OpenAI from 'openai';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DataQueryEngine } from './dataQueryEngine.js';
import { ContextManager } from './contextManager.js';
import { InsightsEngine } from './insightsEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class ChatbotService {
  constructor() {
    console.log('[ChatbotService] Initializing with OpenRouter API');
    
    // Validate API key is present
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY environment variable is required. Please check your .env file.');
    }
    
    this.client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });
    
    // Create service instances (but don't initialize yet)
    this.dataQueryEngine = new DataQueryEngine();
    this.contextManager = new ContextManager();
    this.insightsEngine = new InsightsEngine();
    
    // Initialize knowledge base to empty objects
    this.componentKnowledge = {};
    this.dataSchema = {};
    this.queryPatterns = {};
    
    // Session management
    this.sessions = new Map();
    
    // Track initialization status
    this.isInitialized = false;
    this.initializationPromise = null;
  }
  
  async initialize() {
    if (this.isInitialized) {
      return;
    }
    
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    this.initializationPromise = this._initialize();
    await this.initializationPromise;
    this.isInitialized = true;
  }
  
  async _initialize() {
    const startTime = Date.now();
    console.log('[ChatbotService] Starting async initialization...');
    
    // Initialize DataQueryEngine
    await this.dataQueryEngine.initialize();
    
    // Load knowledge files asynchronously
    const knowledgePromises = [
      this.loadKnowledge('components.json').then(data => this.componentKnowledge = data),
      this.loadKnowledge('dataSchema.json').then(data => this.dataSchema = data),
      this.loadKnowledge('queryPatterns.json').then(data => this.queryPatterns = data)
    ];
    
    await Promise.all(knowledgePromises);
    
    console.log(`[ChatbotService] Initialization complete in ${Date.now() - startTime}ms`);
  }
  
  async loadKnowledge(filename) {
    try {
      const path = join(__dirname, '..', 'knowledge', filename);
      const content = await readFile(path, 'utf8');
      console.log(`[ChatbotService] Successfully loaded ${filename}`);
      return JSON.parse(content);
    } catch (error) {
      console.warn(`[ChatbotService] Failed to load knowledge file ${filename}:`, error.message);
      return {};
    }
  }
  
  isConnected() {
    return !!this.client;
  }
  
  async updateContext(sessionId, context) {
    console.log(`[ChatbotService] Updating context for session ${sessionId}`);
    
    // Ensure service is initialized
    await this.initialize();
    
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        conversationHistory: [],
        context: null
      });
    }
    
    const session = this.sessions.get(sessionId);
    session.context = context;
    
    // Generate proactive insights based on new context
    if (context.generateInsights) {
      const insights = await this.insightsEngine.generateContextualInsights(context);
      return { insights };
    }
  }
  
  buildSystemPrompt(context) {
    const currentYear = new Date().getFullYear();
    
    return `You are an AI assistant for the AHRQ Research Dashboard, a comprehensive tool for analyzing healthcare research publications and their policy impact.

## YOUR KNOWLEDGE BASE:

### 1. DASHBOARD COMPONENTS:
${JSON.stringify(this.componentKnowledge, null, 2)}

### 2. DATA STRUCTURE:
${JSON.stringify(this.dataSchema, null, 2)}

### 3. CURRENT DASHBOARD STATE:
- Active View: ${context.activeView}
- Applied Filters: ${JSON.stringify(context.selectedFilters)}
- Visible Publications: ${context.visiblePublications?.length || 0} items
- Current Metrics: ${JSON.stringify(context.currentMetrics)}
- User Focus: ${context.currentFocus}

### 4. YOUR CAPABILITIES:
1. **Data Analysis**: Query and analyze ${context.totalPublications || 0} AHRQ research publications
2. **Navigation**: Help users navigate between Overview, Network Analysis, Flow Analysis, and Trends views
3. **Insights**: Generate insights about publication trends, author collaborations, and policy impacts
4. **Filtering**: Suggest and apply filters for years (${context.yearRange?.[0] || 2010}-${context.yearRange?.[1] || currentYear}), publication types, usage types, and research domains
5. **Explanations**: Explain visualizations, metrics, and data relationships

### 5. QUERY PATTERNS YOU UNDERSTAND:
${JSON.stringify(this.queryPatterns, null, 2)}

### 6. RESPONSE GUIDELINES:
- Always provide specific, data-driven answers
- Reference actual publication counts and metrics
- Suggest relevant visualizations for the user's question
- When discussing authors or publications, cite specific examples
- Offer to apply filters or navigate to relevant views
- Format responses with clear structure and actionable insights

### 7. AVAILABLE ACTIONS:
- switchView(view: 'overview' | 'network' | 'sankey' | 'trends')
- applyFilter(filterType: string, values: any[])
- highlightElement(elementType: string, elementId: string)
- exportData(format: 'csv' | 'json', filtered: boolean)
- generateReport(reportType: string, parameters: any)

Remember: You have access to real data. Always ground your responses in actual metrics and examples from the AHRQ publications database.`;
  }
  
  async processMessage(userMessage, dashboardContext, visualContext, sessionId) {
    console.log(`[ChatbotService] Processing message for session ${sessionId}: "${userMessage}"`);
    
    // Ensure service is initialized
    await this.initialize();
    
    try {
      // Get or create session
      if (!this.sessions.has(sessionId)) {
        console.log(`[ChatbotService] Creating new session: ${sessionId}`);
        this.sessions.set(sessionId, {
          conversationHistory: [],
          context: dashboardContext
        });
      }
      
      const session = this.sessions.get(sessionId);
      
      // Update context
      session.context = dashboardContext;
      
      // Parse intent from user message
      const intent = await this.parseIntent(userMessage, dashboardContext);
      console.log('[ChatbotService] Parsed intent:', intent);
      
      // Build messages array
      const messages = [
        {
          role: "system",
          content: this.buildSystemPrompt(dashboardContext)
        },
        ...session.conversationHistory.slice(-10), // Keep last 10 messages for context
        {
          role: "user",
          content: visualContext ? [
            { type: "text", text: userMessage },
            { 
              type: "image_url", 
              image_url: { url: `data:image/png;base64,${visualContext}` }
            }
          ] : userMessage
        }
      ];
      
      console.log('[ChatbotService] Calling OpenRouter API...');
      
      // Call OpenRouter API with updated model
      const completion = await this.client.chat.completions.create({
        model: "google/gemini-2.5-flash",  // Updated to current model
        messages,
        extra_headers: {
          "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5173",
          "X-Title": "AHRQ Research Dashboard AI Assistant",
        },
        temperature: 0.3,
        max_tokens: 1500,
        // Note: Gemini 2.5 may not support JSON mode, so we'll handle both formats
      });
      
      console.log('[ChatbotService] Received response from OpenRouter');
      
      let aiResponse;
      try {
        aiResponse = JSON.parse(completion.choices[0].message.content);
      } catch (parseError) {
        console.error('[ChatbotService] Failed to parse AI response as JSON:', parseError);
        // Fallback to plain text response
        aiResponse = {
          message: completion.choices[0].message.content,
          response: completion.choices[0].message.content
        };
      }
      
      console.log('[ChatbotService] AI Response:', aiResponse);
      
      // Process the AI response
      const processedResponse = await this.processAIResponse(aiResponse, dashboardContext, intent);
      
      // Update conversation history
      session.conversationHistory.push(
        { role: "user", content: userMessage },
        { role: "assistant", content: processedResponse.message }
      );
      
      console.log('[ChatbotService] Sending processed response');
      return processedResponse;
      
    } catch (error) {
      console.error('[ChatbotService] Error processing message:', error);
      
      // Check if it's an API error
      if (error.response) {
        console.error('[ChatbotService] API Error Response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      throw new Error(`Failed to process message: ${error.message}`);
    }
  }
  
  async parseIntent(message, context) {
    const lowercaseMessage = message.toLowerCase();
    
    // Check for navigation intents
    if (lowercaseMessage.includes('show') || lowercaseMessage.includes('navigate') || lowercaseMessage.includes('go to')) {
      if (lowercaseMessage.includes('network')) return { type: 'navigation', target: 'network' };
      if (lowercaseMessage.includes('flow') || lowercaseMessage.includes('sankey')) return { type: 'navigation', target: 'sankey' };
      if (lowercaseMessage.includes('trend')) return { type: 'navigation', target: 'trends' };
      if (lowercaseMessage.includes('overview')) return { type: 'navigation', target: 'overview' };
    }
    
    // Check for data query intents
    if (lowercaseMessage.includes('which') || lowercaseMessage.includes('what') || lowercaseMessage.includes('how many')) {
      return { type: 'query', queryType: 'data' };
    }
    
    // Check for filter intents
    if (lowercaseMessage.includes('filter') || lowercaseMessage.includes('show only') || lowercaseMessage.includes('focus on')) {
      return { type: 'filter' };
    }
    
    // Check for explanation intents
    if (lowercaseMessage.includes('explain') || lowercaseMessage.includes('what does') || lowercaseMessage.includes('help me understand')) {
      return { type: 'explanation' };
    }
    
    // Check for insight intents
    if (lowercaseMessage.includes('insight') || lowercaseMessage.includes('trend') || lowercaseMessage.includes('pattern')) {
      return { type: 'insight' };
    }
    
    return { type: 'general' };
  }
  
  async processAIResponse(aiResponse, context, intent) {
    const result = {
      message: aiResponse.message || aiResponse.response || "I understand your request.",
      data: null,
      actions: [],
      suggestions: [],
      visualizations: []
    };
    
    // Handle data queries
    if (aiResponse.query) {
      try {
        console.log('[ChatbotService] Executing data query:', aiResponse.query);
        const queryResults = await this.dataQueryEngine.executeQuery(
          aiResponse.query,
          context
        );
        result.data = queryResults;
      } catch (error) {
        console.error('[ChatbotService] Query execution error:', error);
      }
    }
    
    // Handle navigation actions
    if (aiResponse.action) {
      result.actions.push({
        type: aiResponse.action.type,
        parameters: aiResponse.action.parameters,
        description: aiResponse.action.description
      });
    }
    
    // Handle filter suggestions
    if (aiResponse.filters) {
      result.actions.push({
        type: 'applyFilters',
        parameters: aiResponse.filters,
        description: 'Apply suggested filters'
      });
    }
    
    // Add suggestions for next steps
    if (aiResponse.suggestions) {
      result.suggestions = aiResponse.suggestions;
    } else {
      // Generate contextual suggestions based on intent
      result.suggestions = this.generateSuggestions(intent, context);
    }
    
    // Add visualization recommendations
    if (aiResponse.visualizations) {
      result.visualizations = aiResponse.visualizations;
    }
    
    return result;
  }
  
  generateSuggestions(intent, context) {
    const suggestions = [];
    
    switch (intent.type) {
      case 'query':
        suggestions.push(
          "Would you like me to visualize these results?",
          "Should I filter the dashboard to show only these items?",
          "Would you like more details about any specific item?"
        );
        break;
        
      case 'navigation':
        suggestions.push(
          "Would you like me to explain what this view shows?",
          "Should I highlight any specific elements?",
          "Would you like to see insights for this view?"
        );
        break;
        
      case 'insight':
        suggestions.push(
          "Would you like to explore this trend in more detail?",
          "Should I show you the data behind this insight?",
          "Would you like to see related patterns?"
        );
        break;
        
      default:
        // Context-aware suggestions
        if (context.activeView === 'network') {
          suggestions.push(
            "Would you like to see the most connected authors?",
            "Should I explain the collaboration patterns?",
            "Would you like to filter by specific domains?"
          );
        } else if (context.activeView === 'sankey') {
          suggestions.push(
            "Would you like to trace a specific flow path?",
            "Should I explain the policy impact categories?",
            "Would you like to see which domains have the most impact?"
          );
        }
    }
    
    return suggestions.slice(0, 3); // Return top 3 suggestions
  }
  
  async executeAction(action, sessionId) {
    console.log(`[ChatbotService] Executing action for session ${sessionId}:`, action);
    
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    switch (action.type) {
      case 'switchView':
        return {
          success: true,
          action: 'switchView',
          parameters: { view: action.parameters.view }
        };
        
      case 'applyFilters':
        return {
          success: true,
          action: 'applyFilters',
          parameters: action.parameters
        };
        
      case 'highlightElement':
        return {
          success: true,
          action: 'highlightElement',
          parameters: {
            elementType: action.parameters.elementType,
            elementId: action.parameters.elementId
          }
        };
        
      case 'exportData':
        // This would trigger data export
        return {
          success: true,
          action: 'exportData',
          parameters: action.parameters
        };
        
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }
  
  cleanupSession(sessionId) {
    console.log(`[ChatbotService] Cleaning up session: ${sessionId}`);
    this.sessions.delete(sessionId);
  }
}