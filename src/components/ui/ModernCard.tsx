import React from 'react';
import { theme } from '../../styles/theme';

interface ModernCardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'glass' | 'gradient' | 'interactive';
  className?: string;
  onClick?: () => void;
}

export const ModernCard: React.FC<ModernCardProps> = ({ 
  children, 
  variant = 'elevated', 
  className = '',
  onClick
}) => {
  const baseClasses = "rounded-xl p-6 transition-all duration-300";
  
  const variantClasses = {
    elevated: "bg-white shadow-lg hover:shadow-xl border border-gray-100",
    glass: "backdrop-blur-md bg-white/70 border border-white/20 shadow-xl",
    gradient: `bg-gradient-to-br from-white to-gray-50 border border-gray-100 shadow-lg`,
    interactive: "bg-white shadow-lg hover:shadow-xl border border-gray-100 cursor-pointer transform hover:scale-[1.02] hover:-translate-y-1"
  };
  
  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  color: keyof typeof theme.colors.accent;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  change,
  icon,
  color
}) => {
  const gradients = {
    purple: 'from-purple-500 to-purple-700',
    pink: 'from-pink-500 to-pink-700',
    amber: 'from-amber-500 to-amber-700',
    emerald: 'from-emerald-500 to-emerald-700',
    rose: 'from-rose-500 to-rose-700',
    indigo: 'from-indigo-500 to-indigo-700',
  };
  
  return (
    <div className={`relative overflow-hidden rounded-xl p-6 bg-gradient-to-br ${gradients[color]} text-white`}>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium opacity-90">{label}</p>
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            {icon}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {change && (
            <div className={`flex items-center gap-1 text-sm font-medium ${change.isPositive ? 'text-green-200' : 'text-red-200'}`}>
              <span>{change.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(change.value)}%</span>
            </div>
          )}
        </div>
      </div>
      {/* Decorative background pattern */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
    </div>
  );
};