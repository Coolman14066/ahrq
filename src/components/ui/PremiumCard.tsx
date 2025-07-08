import React, { useState, useRef, MouseEvent } from 'react';
import { premiumTheme } from '../../styles/premium-theme';

interface PremiumCardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'glass' | 'gradient' | 'interactive' | 'glow';
  className?: string;
  onClick?: () => void;
  hoverEffect?: 'lift' | 'tilt' | 'glow' | 'magnetic';
  padding?: 'compact' | 'standard' | 'spacious';
  borderGlow?: boolean;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({
  children,
  variant = 'elevated',
  className = '',
  onClick,
  hoverEffect = 'lift',
  padding = 'standard',
  borderGlow = false,
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    
    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  };

  // Base styles for all cards
  const baseStyles = `
    relative
    rounded-xl
    transition-all
    duration-300
    cursor-${onClick ? 'pointer' : 'default'}
    ${padding === 'compact' ? 'p-6' : padding === 'spacious' ? 'p-10' : 'p-8'}
  `;

  // Variant-specific styles
  const variantStyles = {
    elevated: `
      bg-white
      shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)]
      hover:shadow-[0_14px_28px_rgba(0,0,0,0.25),0_10px_10px_rgba(0,0,0,0.22)]
      border border-gray-100
    `,
    glass: `
      backdrop-blur-xl
      bg-white/80
      border border-white/20
      shadow-[0_8px_32px_rgba(0,0,0,0.12)]
      hover:bg-white/90
      hover:shadow-[0_8px_32px_rgba(0,0,0,0.18)]
    `,
    gradient: `
      bg-gradient-to-br from-white via-gray-50 to-gray-100
      shadow-[0_4px_16px_rgba(0,0,0,0.1)]
      hover:shadow-[0_8px_32px_rgba(0,0,0,0.15)]
      border border-gray-200/50
    `,
    interactive: `
      bg-white
      shadow-[0_2px_8px_rgba(0,0,0,0.08)]
      hover:shadow-[0_16px_48px_rgba(0,0,0,0.15)]
      border border-gray-200
      transform-gpu
    `,
    glow: `
      bg-white
      shadow-[0_0_24px_rgba(59,130,246,0.15)]
      hover:shadow-[0_0_48px_rgba(59,130,246,0.25)]
      border border-blue-200/30
    `,
  };

  // Hover effect transforms
  const getTransform = () => {
    if (!isHovered) return '';
    
    switch (hoverEffect) {
      case 'lift':
        return 'translateY(-4px)';
      case 'tilt':
        return `perspective(1000px) rotateX(${mousePosition.y * 5}deg) rotateY(${mousePosition.x * 5}deg)`;
      case 'magnetic':
        return `translate(${mousePosition.x * 4}px, ${mousePosition.y * 4}px)`;
      default:
        return '';
    }
  };

  // Dynamic styles based on mouse position
  const dynamicStyles = {
    transform: getTransform(),
    transition: isHovered 
      ? 'all 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275)' 
      : 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
  };

  return (
    <div
      ref={cardRef}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={dynamicStyles}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Premium border glow effect */}
      {borderGlow && isHovered && (
        <div 
          className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x * 50 + 50}% ${mousePosition.y * 50 + 50}%, rgba(59,130,246,0.2), transparent 40%)`,
            opacity: isHovered ? 1 : 0,
          }}
        />
      )}
      
      {/* Noise texture overlay for premium feel */}
      <div className="absolute inset-0 rounded-xl opacity-[0.02] pointer-events-none">
        <div 
          className="w-full h-full rounded-xl"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Hover glow effect */}
      {hoverEffect === 'glow' && (
        <div 
          className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(800px circle at ${mousePosition.x * 50 + 50}% ${mousePosition.y * 50 + 50}%, rgba(59,130,246,0.06), transparent 40%)`,
            opacity: isHovered ? 1 : 0,
          }}
        />
      )}
    </div>
  );
};

// Premium Metric Card with sophisticated styling
interface PremiumMetricCardProps {
  label: string;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  color: 'primary' | 'discovery' | 'validation' | 'methodology' | 'attention' | 'critical';
  trend?: number[];
}

export const PremiumMetricCard: React.FC<PremiumMetricCardProps> = ({
  label,
  value,
  change,
  icon,
  color,
  trend,
}) => {
  // Safe color mapping with fallbacks
  const colorMap = {
    primary: premiumTheme.colors?.primary?.base || '#1e3a8a',
    discovery: premiumTheme.colors?.accent?.base || '#0f766e',
    validation: premiumTheme.colors?.accent?.light || '#14b8a6',
    methodology: premiumTheme.colors?.primary?.base || '#1e3a8a',
    attention: premiumTheme.colors?.warning?.base || '#d97706',
    critical: premiumTheme.colors?.warning?.dark || '#92400e',
  };

  const bgColorMap = {
    primary: 'from-blue-500/10 to-blue-600/5',
    discovery: 'from-teal-500/10 to-teal-600/5',
    validation: 'from-green-500/10 to-green-600/5',
    methodology: 'from-purple-500/10 to-purple-600/5',
    attention: 'from-amber-500/10 to-amber-600/5',
    critical: 'from-red-500/10 to-red-600/5',
  };

  return (
    <div className="h-full">
      <PremiumCard variant="interactive" hoverEffect="lift" className="h-full min-h-[120px] flex flex-col">
        <div className="flex-1 flex flex-col">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-5xl font-bold tracking-tight mb-4" style={{ color: colorMap[color] }}>
                {value}
              </h3>
              <p className="text-sm font-medium text-gray-700">{label}</p>
              {change && (
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs font-semibold ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {change.isPositive ? '↑' : '↓'} {Math.abs(change.value)}%
                  </span>
                  <span className="text-xs text-gray-500">vs last period</span>
                </div>
              )}
            </div>
            <div 
              className={`p-3 rounded-xl bg-gradient-to-br ${bgColorMap[color]} ml-4`}
              style={{ color: colorMap[color] }}
            >
              {icon}
            </div>
          </div>
          
          {trend && trend.length > 0 && (
            <div className="mt-auto pt-4">
              <div className="h-10 flex items-end gap-0.5">
                {trend.map((value, index) => {
                  const maxValue = Math.max(...trend.filter(v => typeof v === 'number' && !isNaN(v))) || 1;
                  const height = value && !isNaN(value) ? (value / maxValue) * 100 : 0;
                  return (
                    <div
                      key={index}
                      className="flex-1 bg-gradient-to-t rounded-t transition-all duration-300 hover:opacity-80"
                      style={{
                        height: `${Math.max(0, Math.min(100, height))}%`,
                        background: `linear-gradient(to top, ${colorMap[color]}40, ${colorMap[color]}20)`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </PremiumCard>
    </div>
  );
};

// Premium Section Card with header
interface PremiumSectionCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  variant?: 'elevated' | 'glass';
}

export const PremiumSectionCard: React.FC<PremiumSectionCardProps> = ({
  title,
  subtitle,
  children,
  action,
  variant = 'elevated',
}) => {
  return (
    <PremiumCard variant={variant} padding="spacious">
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[18px] font-semibold text-[#1e293b] tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-[14px] font-normal text-[#64748b]">
                {subtitle}
              </p>
            )}
          </div>
          {action && (
            <div className="ml-4">
              {action}
            </div>
          )}
        </div>
      </div>
      {children}
    </PremiumCard>
  );
};