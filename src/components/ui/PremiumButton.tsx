import React, { useState, MouseEvent } from 'react';

interface PremiumButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass' | 'gradient';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onClick?: () => void;
  className?: string;
  ripple?: boolean;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  onClick,
  className = '',
  ripple = true,
}) => {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    // Ripple effect
    if (ripple) {
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();

      setRipples(prev => [...prev, { x, y, id }]);
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id));
      }, 600);
    }

    onClick?.();
  };

  // Size classes
  const sizeClasses = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg',
  };

  // Base styles
  const baseStyles = `
    relative overflow-hidden
    font-semibold tracking-wide
    rounded-lg
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
    ${sizeClasses[size]}
  `;

  // Variant styles
  const variantStyles = {
    primary: `
      bg-gradient-to-r from-blue-600 to-blue-700
      text-white
      hover:from-blue-700 hover:to-blue-800
      focus:ring-blue-500
      disabled:from-gray-400 disabled:to-gray-500
      shadow-lg hover:shadow-xl
    `,
    secondary: `
      bg-white
      text-gray-900
      border-2 border-gray-200
      hover:bg-gray-50 hover:border-gray-300
      focus:ring-gray-500
      disabled:bg-gray-100 disabled:text-gray-400
      shadow-sm hover:shadow-md
    `,
    ghost: `
      bg-transparent
      text-gray-700
      hover:bg-gray-100
      focus:ring-gray-500
      disabled:text-gray-400
    `,
    glass: `
      backdrop-blur-md
      bg-white/10
      text-white
      border border-white/20
      hover:bg-white/20
      focus:ring-white/50
      disabled:bg-white/5 disabled:text-white/50
      shadow-lg
    `,
    gradient: `
      bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600
      text-white
      hover:from-purple-700 hover:via-pink-700 hover:to-blue-700
      focus:ring-purple-500
      disabled:from-gray-400 disabled:via-gray-400 disabled:to-gray-400
      shadow-lg hover:shadow-xl
      background-size: 200% 200%
      animation: gradient 3s ease infinite
    `,
  };

  // Loading spinner
  const LoadingSpinner = () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div 
        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
      />
    </div>
  );

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* Content */}
      <span className={`flex items-center justify-center gap-2 ${loading ? 'opacity-0' : ''}`}>
        {icon && iconPosition === 'left' && icon}
        {children}
        {icon && iconPosition === 'right' && icon}
      </span>

      {/* Loading state */}
      {loading && <LoadingSpinner />}

      {/* Hover gradient effect for gradient variant */}
      {variant === 'gradient' && (
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
        </div>
      )}
    </button>
  );
};

// Icon button variant
interface PremiumIconButtonProps {
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  tooltip?: string;
  className?: string;
}

export const PremiumIconButton: React.FC<PremiumIconButtonProps> = ({
  icon,
  variant = 'ghost',
  size = 'medium',
  onClick,
  disabled = false,
  loading = false,
  tooltip,
  className = '',
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-12 h-12',
  };

  return (
    <div className="relative group">
      <PremiumButton
        variant={variant}
        onClick={onClick}
        disabled={disabled}
        loading={loading}
        className={`!p-0 ${sizeClasses[size]} ${className}`}
      >
        {icon}
      </PremiumButton>
      
      {/* Tooltip */}
      {tooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
};

// Button group component
interface PremiumButtonGroupProps {
  children: React.ReactNode;
  variant?: 'separate' | 'connected';
  className?: string;
}

export const PremiumButtonGroup: React.FC<PremiumButtonGroupProps> = ({
  children,
  variant = 'separate',
  className = '',
}) => {
  return (
    <div 
      className={`
        flex items-center
        ${variant === 'separate' ? 'gap-2' : 'divide-x divide-gray-300'}
        ${className}
      `}
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child) && variant === 'connected') {
          const isFirst = index === 0;
          const isLast = index === React.Children.count(children) - 1;
          
          return React.cloneElement(child as React.ReactElement<any>, {
            className: `${child.props.className || ''} ${
              !isFirst ? '!rounded-l-none' : ''
            } ${!isLast ? '!rounded-r-none' : ''}`,
          });
        }
        return child;
      })}
    </div>
  );
};