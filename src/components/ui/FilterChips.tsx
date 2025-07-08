import React from 'react';
import { X, Check } from 'lucide-react';

interface FilterChipProps {
  label: string;
  value: string;
  isActive: boolean;
  onToggle: (value: string) => void;
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'red' | 'gray';
  icon?: React.ReactNode;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  value,
  isActive,
  onToggle,
  color = 'blue',
  icon
}) => {
  const colorClasses = {
    blue: {
      active: 'bg-blue-100 text-blue-800 border-blue-300',
      inactive: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
    },
    green: {
      active: 'bg-green-100 text-green-800 border-green-300',
      inactive: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
    },
    purple: {
      active: 'bg-purple-100 text-purple-800 border-purple-300',
      inactive: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
    },
    amber: {
      active: 'bg-amber-100 text-amber-800 border-amber-300',
      inactive: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
    },
    red: {
      active: 'bg-red-100 text-red-800 border-red-300',
      inactive: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
    },
    gray: {
      active: 'bg-gray-100 text-gray-800 border-gray-400',
      inactive: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
    }
  };

  const classes = isActive ? colorClasses[color].active : colorClasses[color].inactive;

  return (
    <button
      onClick={() => onToggle(value)}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 
        border rounded-full text-sm font-medium
        transition-all duration-200 
        ${classes}
        ${isActive ? 'shadow-sm' : ''}
      `}
    >
      {icon && <span className="text-xs">{icon}</span>}
      {label}
      {isActive && <Check size={14} className="ml-1" />}
    </button>
  );
};

interface FilterGroupProps {
  title: string;
  options: Array<{ label: string; value: string; count?: number }>;
  selectedValue: string;
  onChange: (value: string) => void;
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'red' | 'gray';
  allowMultiple?: boolean;
  selectedValues?: string[];
  onMultiChange?: (values: string[]) => void;
}

export const FilterGroup: React.FC<FilterGroupProps> = ({
  title,
  options,
  selectedValue,
  onChange,
  color = 'blue',
  allowMultiple = false,
  selectedValues = [],
  onMultiChange
}) => {
  const handleToggle = (value: string) => {
    if (allowMultiple && onMultiChange) {
      if (selectedValues.includes(value)) {
        onMultiChange(selectedValues.filter(v => v !== value));
      } else {
        onMultiChange([...selectedValues, value]);
      }
    } else {
      onChange(value === selectedValue ? 'all' : value);
    }
  };

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {options.map(option => (
          <FilterChip
            key={option.value}
            label={option.count ? `${option.label} (${option.count})` : option.label}
            value={option.value}
            isActive={
              allowMultiple 
                ? selectedValues.includes(option.value)
                : option.value === selectedValue
            }
            onToggle={handleToggle}
            color={color}
          />
        ))}
      </div>
    </div>
  );
};

interface ActiveFiltersProps {
  filters: Array<{
    category: string;
    label: string;
    value: string;
    onRemove: () => void;
  }>;
  onClearAll: () => void;
}

export const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  filters,
  onClearAll
}) => {
  if (filters.length === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-blue-900">Active Filters</h4>
        <button
          onClick={onClearAll}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Clear all
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter, index) => (
          <span
            key={`${filter.category}-${filter.value}-${index}`}
            className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-blue-300 rounded-full text-sm"
          >
            <span className="text-blue-600 font-medium">{filter.category}:</span>
            <span className="text-gray-700">{filter.label}</span>
            <button
              onClick={filter.onRemove}
              className="ml-1 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

// Modern dropdown select component
interface SelectDropdownProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  icon?: React.ReactNode;
}

export const SelectDropdown: React.FC<SelectDropdownProps> = ({
  label,
  value,
  onChange,
  options,
  icon
}) => {
  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`
            w-full px-3 py-2 border border-gray-300 rounded-lg
            bg-white text-gray-900
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            appearance-none cursor-pointer
            ${icon ? 'pl-10' : ''}
          `}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};