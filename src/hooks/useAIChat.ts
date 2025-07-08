import { useState, useCallback, useRef, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  actions?: Array<{
    type: string;
    parameters: any;
    description: string;
  }>;
  visualizations?: any[];
}

interface ChatbotHook {
  messages: Message[];
  isLoading: boolean;
  suggestions: string[];
  sendMessage: (message: string, context: any) => void;
  executeAction: (action: any) => void;
  clearHistory: () => void;
  isConnected: boolean;
  connectionError: string | null;
}

const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:3002';

export const useChatbot = (): ChatbotHook => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const sessionIdRef = useRef<string>(generateSessionId());
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = Infinity; // Never stop trying
  const reconnectIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize Socket.IO connection
  useEffect(() => {
    console.log('[useAIChat] Initializing Socket.IO connection to:', BACKEND_URL);
    
    // Add a small delay to ensure server is ready
    const initTimeout = setTimeout(() => {
      socketRef.current = io(BACKEND_URL, {
        transports: ['polling', 'websocket'], // Start with polling for reliability
        reconnection: true,
        reconnectionAttempts: Infinity, // Never stop trying
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000, // Max 5 seconds between attempts
        timeout: 20000,
        autoConnect: true,
        forceNew: false, // Reuse connection if possible
      });
    
    socketRef.current.on('connect', () => {
      console.log('[useAIChat] Connected to AI backend');
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttemptsRef.current = 0;
      
      // Clear manual reconnection interval if it exists
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
        reconnectIntervalRef.current = null;
      }
    });
    
    socketRef.current.on('disconnect', () => {
      console.log('[useAIChat] Disconnected from AI backend');
      setIsConnected(false);
    });
    
    socketRef.current.on('connect_error', (error) => {
      console.error('[useAIChat] Connection error:', error.message);
      setConnectionError(`Failed to connect to AI backend: ${error.message}`);
      setIsConnected(false);
    });
    
    socketRef.current.on('reconnect_attempt', (attemptNumber) => {
      console.log(`[useAIChat] Reconnection attempt ${attemptNumber}`);
      reconnectAttemptsRef.current = attemptNumber;
      setConnectionError(`Reconnecting to backend... (attempt ${attemptNumber})`);
    });
    
    socketRef.current.on('reconnect_failed', () => {
      // This should never happen with infinite attempts, but just in case
      console.error('[useAIChat] Socket.io gave up reconnecting');
      setConnectionError('Connection lost. Attempting manual reconnection...');
      
      // Implement manual reconnection fallback
      if (!reconnectIntervalRef.current) {
        reconnectIntervalRef.current = setInterval(() => {
          console.log('[useAIChat] Manual reconnection attempt');
          if (socketRef.current && !socketRef.current.connected) {
            socketRef.current.connect();
          }
        }, 5000);
      }
    });
    
    socketRef.current.on('reconnect', (attemptNumber) => {
      console.log(`[useAIChat] Reconnected successfully after ${attemptNumber} attempts`);
      setConnectionError(null);
    });
    
    // Handle chat responses
    socketRef.current.on('chat:response', (response: any) => {
      console.log('[useAIChat] Received chat response:', response);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.message,
        data: response.data,
        actions: response.actions,
        visualizations: response.visualizations
      }]);
      
      if (response.suggestions) {
        setSuggestions(response.suggestions);
      }
      
      setIsLoading(false);
    });
    
    // Handle errors
    socketRef.current.on('chat:error', (error: any) => {
      console.error('[useAIChat] Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.'
      }]);
      setIsLoading(false);
    });
    
    // Handle context acknowledgment
    socketRef.current.on('context:acknowledged', (data: any) => {
      console.log('[useAIChat] Context updated:', data);
    });
    
    // Handle action results
    socketRef.current.on('action:result', (result: any) => {
      console.log('[useAIChat] Action result:', result);
      if (result.success) {
        // Execute the action in the dashboard
        if (result.action === 'switchView' && (window as any).__ahrqChatbotViewChange) {
          (window as any).__ahrqChatbotViewChange(result.parameters.view);
        } else if (result.action === 'applyFilters' && (window as any).__ahrqChatbotFilterChange) {
          (window as any).__ahrqChatbotFilterChange(result.parameters);
        }
      }
    });
    }, 100); // 100ms delay to ensure server is ready
    
    return () => {
      console.log('[useAIChat] Cleaning up Socket.IO connection');
      clearTimeout(initTimeout);
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
        reconnectIntervalRef.current = null;
      }
      socketRef.current?.disconnect();
    };
  }, []);
  
  // Send message to backend
  const sendMessage = useCallback((message: string, context: any) => {
    console.log('[useAIChat] Sending message:', message);
    console.log('[useAIChat] With context:', context);
    
    if (!message.trim()) {
      console.warn('[useAIChat] Empty message, not sending');
      return;
    }
    
    if (!socketRef.current?.connected) {
      console.error('[useAIChat] Socket not connected, falling back to REST API');
      // Fall back to REST API
      sendMessageREST(message, context);
      return;
    }
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setIsLoading(true);
    setSuggestions([]);
    
    // Send to backend via Socket.IO
    socketRef.current.emit('chat:message', {
      message,
      context,
      sessionId: sessionIdRef.current
    });
  }, []);
  
  // Fallback REST API implementation
  const sendMessageREST = async (message: string, context: any) => {
    console.log('[useAIChat] Using REST API fallback');
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setIsLoading(true);
    setSuggestions([]);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context,
          sessionId: sessionIdRef.current
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[useAIChat] REST API response:', data);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        data: data.data,
        actions: data.actions,
        visualizations: data.visualizations
      }]);
      
      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('[useAIChat] REST API error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I couldn't connect to the AI service. Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Execute action
  const executeAction = useCallback((action: any) => {
    console.log('[useAIChat] Executing action:', action);
    
    if (!socketRef.current?.connected) {
      console.error('[useAIChat] Socket not connected for action execution');
      return;
    }
    
    socketRef.current.emit('action:execute', {
      ...action,
      sessionId: sessionIdRef.current
    });
  }, []);
  
  // Clear chat history
  const clearHistory = useCallback(() => {
    console.log('[useAIChat] Clearing chat history');
    setMessages([]);
    setSuggestions([]);
    
    // Generate new session ID
    sessionIdRef.current = generateSessionId();
  }, []);
  
  // Update context periodically
  useEffect(() => {
    const updateContext = (context: any) => {
      if (socketRef.current?.connected) {
        console.log('[useAIChat] Updating context:', context);
        socketRef.current.emit('context:update', {
          context,
          sessionId: sessionIdRef.current
        });
      }
    };
    
    // Expose update context function
    (window as any).__ahrqChatbotUpdateContext = updateContext;
    
    return () => {
      delete (window as any).__ahrqChatbotUpdateContext;
    };
  }, []);
  
  return {
    messages,
    isLoading,
    suggestions,
    sendMessage,
    executeAction,
    clearHistory,
    isConnected,
    connectionError
  };
};

// Helper function to generate session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Export the main hook
export const useAIChat = useChatbot;