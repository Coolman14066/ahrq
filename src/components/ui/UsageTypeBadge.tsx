import React from 'react';
import { Info } from 'lucide-react';

interface UsageTypeBadgeProps {
  type: 'PRIMARY_ANALYSIS' | 'RESEARCH_ENABLER' | 'CONTEXTUAL_REFERENCE';
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
  className?: string;
}

const usageTypeConfig = {
  PRIMARY_ANALYSIS: {
    label: 'Primary Analysis',
    shortLabel: 'Primary',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-300',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-blue-700',
    icon: '🔬',
    description: 'Direct use of AHRQ data/tools as primary research resource'
  },
  RESEARCH_ENABLER: {
    label: 'Research Enabler',
    shortLabel: 'Enabler',
    color: 'teal',
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-800',
    borderColor: 'border-teal-300',
    gradientFrom: 'from-teal-500',
    gradientTo: 'to-teal-700',
    icon: '🔧',
    description: 'AHRQ resources enable or support the research methodology'
  },
  CONTEXTUAL_REFERENCE: {
    label: 'Contextual Reference',
    shortLabel: 'Context',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-300',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-purple-700',
    icon: '📚',
    description: 'AHRQ cited for background context or comparison'
  }
};

export const UsageTypeBadge: React.FC<UsageTypeBadgeProps> = ({ 
  type, 
  size = 'medium',
  showTooltip = false,
  className = ''
}) => {
  const config = usageTypeConfig[type];
  
  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs',
    medium: 'px-3 py-1 text-sm',
    large: 'px-4 py-2 text-base'
  };
  
  const iconSizes = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };
  
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <span 
        className={`
          inline-flex items-center gap-1.5 
          ${sizeClasses[size]} 
          ${config.bgColor} 
          ${config.textColor} 
          border ${config.borderColor}
          rounded-full font-medium
          transition-all duration-200
          hover:shadow-md hover:scale-105
        `}
      >
        <span className={iconSizes[size]}>{config.icon}</span>
        <span>{size === 'small' ? config.shortLabel : config.label}</span>
      </span>
      
      {showTooltip && (
        <div className="group relative inline-flex">
          <Info className={`${iconSizes[size]} ${config.textColor} cursor-help`} />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
            <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 max-w-xs whitespace-normal">
              <div className="font-semibold mb-1">{config.label}</div>
              <div>{config.description}</div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                <div className="border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Compact version for inline display
interface CompactUsageBadgeProps {
  type: 'PRIMARY_ANALYSIS' | 'RESEARCH_ENABLER' | 'CONTEXTUAL_REFERENCE';
}

export const CompactUsageBadge: React.FC<CompactUsageBadgeProps> = ({ type }) => {
  const config = usageTypeConfig[type];
  
  return (
    <span 
      className={`
        inline-flex items-center justify-center
        w-6 h-6 rounded-full
        ${config.bgColor} ${config.textColor}
        border ${config.borderColor}
        text-xs font-bold
        cursor-help
        transition-all duration-200
        hover:scale-110 hover:shadow-md
      `}
      title={config.label}
    >
      {config.label.charAt(0)}
    </span>
  );
};

// Badge group for displaying multiple usage types
interface UsageTypeBadgeGroupProps {
  types: ('PRIMARY_ANALYSIS' | 'RESEARCH_ENABLER' | 'CONTEXTUAL_REFERENCE')[];
  size?: 'small' | 'medium' | 'large';
  compact?: boolean;
}

export const UsageTypeBadgeGroup: React.FC<UsageTypeBadgeGroupProps> = ({ 
  types, 
  size = 'small',
  compact = false 
}) => {
  const uniqueTypes = Array.from(new Set(types));
  
  if (compact) {
    return (
      <div className="inline-flex items-center gap-1">
        {uniqueTypes.map(type => (
          <CompactUsageBadge key={type} type={type} />
        ))}
      </div>
    );
  }
  
  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      {uniqueTypes.map(type => (
        <UsageTypeBadge key={type} type={type} size={size} />
      ))}
    </div>
  );
};