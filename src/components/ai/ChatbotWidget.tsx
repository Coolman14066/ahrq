import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2, Loader2, Sparkles, WifiOff, Wifi } from 'lucide-react';
import { useChatbot } from '../../hooks/useAIChat';
import { ChatMessage } from './ChatMessage';
import { ChatSuggestions } from './ChatSuggestions';
import { useDashboardContext } from './ChatContext';
import '../../styles/chatbot.css';

interface ChatbotWidgetProps {
  className?: string;
}

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const dashboardContext = useDashboardContext();
  const {
    messages,
    isLoading,
    suggestions,
    sendMessage,
    executeAction,
    clearHistory,
    isConnected,
    connectionError
  } = useChatbot();
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  const handleSendMessage = () => {
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue, dashboardContext);
      setInputValue('');
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  };
  
  const handleActionClick = (action: any) => {
    executeAction(action);
  };
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110 z-50 ${className}`}
        aria-label="Open AI Assistant"
      >
        <div className="relative">
          <MessageCircle size={24} />
          <Sparkles 
            size={12} 
            className="absolute -top-1 -right-1 text-yellow-300 animate-pulse" 
          />
        </div>
      </button>
    );
  }
  
  return (
    <div
      className={`chatbot-container ${isMinimized ? 'minimized' : ''} ${className}`}
    >
      {/* Header */}
      <div className="chatbot-header">
        <div className="flex items-center gap-2">
          <div className="relative">
            <MessageCircle size={20} />
            <Sparkles 
              size={10} 
              className="absolute -top-1 -right-1 text-yellow-300 animate-pulse" 
            />
          </div>
          <h3 className="font-semibold">AHRQ Research Assistant</h3>
          {/* Connection Status */}
          <div className="chatbot-connection-status">
            {isConnected ? (
              <Wifi size={14} className="text-green-300" />
            ) : (
              <WifiOff size={14} className="text-red-300" />
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:bg-white/20 p-1 rounded transition-colors"
            aria-label={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-white/20 p-1 rounded transition-colors"
            aria-label="Close chat"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="chatbot-messages">
            {/* Connection Error */}
            {connectionError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <div className="flex items-center gap-2">
                  <WifiOff size={16} />
                  <span>{connectionError}</span>
                </div>
                <p className="mt-1 text-xs">Messages will be sent when connection is restored.</p>
              </div>
            )}
            
            {messages.length === 0 && (
              <div className="chatbot-empty-state">
                <Sparkles className="mx-auto mb-3 text-blue-500" size={32} />
                <p className="text-lg font-medium mb-2">Hi! I'm your AHRQ Research Assistant</p>
                <p className="text-sm">I can help you:</p>
                <ul className="text-sm mt-2 space-y-1">
                  <li>• Explore research publications and trends</li>
                  <li>• Analyze author collaborations</li>
                  <li>• Understand policy impacts</li>
                  <li>• Navigate the dashboard</li>
                </ul>
                <p className="text-sm mt-3 font-medium">What would you like to know?</p>
              </div>
            )}
            
            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                message={message}
                onActionClick={handleActionClick}
                className="chat-message"
              />
            ))}
            
            {isLoading && (
              <div className="chatbot-loading">
                <Loader2 className="animate-spin" size={16} />
                <span className="text-sm">Thinking...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="chatbot-suggestions">
              <ChatSuggestions
                suggestions={suggestions}
                onSuggestionClick={handleSuggestionClick}
              />
            </div>
          )}
          
          {/* Input */}
          <div className="chatbot-input-section">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about the research..."
                className="chatbot-input flex-1"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </div>
            
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>Powered by Gemini 2.5 Flash</span>
              <button
                onClick={clearHistory}
                className="hover:text-gray-700 transition-colors"
              >
                Clear chat
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};