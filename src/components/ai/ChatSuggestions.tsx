import React from 'react';
import { Lightbulb } from 'lucide-react';

interface ChatSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

export const ChatSuggestions: React.FC<ChatSuggestionsProps> = ({ 
  suggestions, 
  onSuggestionClick 
}) => {
  if (suggestions.length === 0) return null;
  
  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <Lightbulb size={12} />
        <span>Suggestions</span>
      </div>
      <div className="space-y-1">
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => onSuggestionClick(suggestion)}
            className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors text-gray-700"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};