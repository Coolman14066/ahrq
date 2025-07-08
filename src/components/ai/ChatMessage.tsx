import React from 'react';
import { User, Bot, ChevronRight, BarChart2, Network, TrendingUp, FileText } from 'lucide-react';

interface ChatMessageProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
    data?: any;
    actions?: Array<{
      type: string;
      parameters: any;
      description: string;
    }>;
    visualizations?: Array<{
      type: string;
      title: string;
      data: any;
    }>;
  };
  onActionClick?: (action: any) => void;
  className?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onActionClick, className }) => {
  const isUser = message.role === 'user';
  
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'switchView':
        return <ChevronRight size={14} />;
      case 'applyFilters':
        return <BarChart2 size={14} />;
      case 'highlightElement':
        return <Network size={14} />;
      case 'generateReport':
        return <FileText size={14} />;
      default:
        return <ChevronRight size={14} />;
    }
  };
  
  const getViewIcon = (view: string) => {
    switch (view) {
      case 'network':
        return <Network size={14} />;
      case 'trends':
        return <TrendingUp size={14} />;
      case 'overview':
        return <BarChart2 size={14} />;
      default:
        return <ChevronRight size={14} />;
    }
  };
  
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} ${className || ''}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      
      {/* Message Content */}
      <div className={`flex-1 ${isUser ? 'text-right' : ''}`}>
        <div
          className={`inline-block px-4 py-2 rounded-lg ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
          
          {/* Data Display */}
          {message.data && (
            <div className="mt-3 text-sm">
              {message.data.type === 'query_result' && (
                <div className="space-y-2">
                  <p className="font-medium">{message.data.summary}</p>
                  {message.data.count > 0 && (
                    <p className="opacity-90">Found {message.data.count} results</p>
                  )}
                </div>
              )}
              
              {message.data.type === 'trend_analysis' && (
                <div className="space-y-2">
                  <p className="font-medium">Trend Analysis</p>
                  {message.data.trends && (
                    <div className="opacity-90">
                      {message.data.trends.slice(0, 3).map((trend: any, idx: number) => (
                        <div key={idx}>
                          {trend.year}: {trend.count} publications
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Actions */}
          {message.actions && message.actions.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => onActionClick?.(action)}
                  className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${
                    isUser
                      ? 'bg-blue-700 hover:bg-blue-800 text-white'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border'
                  }`}
                >
                  {action.type === 'switchView' ? 
                    getViewIcon(action.parameters.view) : 
                    getActionIcon(action.type)
                  }
                  <span>{action.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};