/** @jsxImportSource react */
import { useEffect, useRef, useState, useCallback } from 'react';
import { premiumTheme } from '../styles/premium-theme';

// Premium animation configurations
export const animations = {
  // Entrance animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.4, ease: 'easeOut' }
  },
  
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }
  },
  
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }
  },
  
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4, ease: [0.175, 0.885, 0.32, 1.275] }
  },
  
  // Hover animations
  lift: {
    whileHover: { 
      y: -4, 
      boxShadow: premiumTheme.shadows.interactive.hover,
      transition: { duration: 0.2, ease: 'easeOut' }
    }
  },
  
  glow: {
    whileHover: {
      boxShadow: premiumTheme.shadows.glow.primary,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  },
  
  // Loading animations
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  },
  
  shimmer: {
    animate: {
      backgroundPosition: ['200% 0', '-200% 0'],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'linear'
      }
    }
  }
};

// Hook for intersection observer animations
export const useInViewAnimation = (
  options: IntersectionObserverInit = { threshold: 0.1 }
) => {
  const [isInView, setIsInView] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated) {
        setIsInView(true);
        setHasAnimated(true);
      }
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [hasAnimated, options]);

  return { ref, isInView };
};

// Hook for parallax scrolling
export const useParallax = (speed: number = 0.5) => {
  const [offset, setOffset] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      
      const rect = ref.current.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const windowCenter = window.innerHeight / 2;
      const distance = centerY - windowCenter;
      
      setOffset(distance * speed);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [speed]);

  return { ref, offset };
};

// Hook for magnetic hover effect
export const useMagneticHover = (strength: number = 0.3) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distanceX = (e.clientX - centerX) * strength;
    const distanceY = (e.clientY - centerY) * strength;

    setPosition({ x: distanceX, y: distanceY });
  }, [strength]);

  const handleMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return { ref, position };
};

// Hook for number counter animation
export const useCountUp = (
  end: number,
  duration: number = 2000,
  startOnView: boolean = true
) => {
  const [count, setCount] = useState(0);
  const { ref, isInView } = useInViewAnimation();

  useEffect(() => {
    if (!startOnView || isInView) {
      let startTime: number | null = null;
      const startValue = 0;

      const animate = (currentTime: number) => {
        if (startTime === null) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(startValue + (end - startValue) * easeOutQuart);
        
        setCount(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [end, duration, isInView, startOnView]);

  return { ref, count };
};

// Hook for stagger children animations
export const useStaggerChildren = (
  delayBetween: number = 0.1,
  initialDelay: number = 0
) => {
  const getChildDelay = (index: number) => initialDelay + index * delayBetween;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: delayBetween,
        delayChildren: initialDelay
      }
    }
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.175, 0.885, 0.32, 1.275]
      }
    }
  };

  return { containerVariants, childVariants, getChildDelay };
};

// Premium loading states
export const LoadingStates = {
  Shimmer: () => (
    <div className="animate-pulse">
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-md mb-2" />
      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-md w-3/4" />
    </div>
  ),
  
  Spinner: ({ size = 40, color = premiumTheme.colors.primary.base }: { size?: number; color?: string }) => (
    <div 
      className="animate-spin rounded-full border-2 border-transparent"
      style={{
        width: size,
        height: size,
        borderTopColor: color,
        borderRightColor: color,
      }}
    />
  ),
  
  Dots: ({ color = premiumTheme.colors.primary.base }: { color?: string }) => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full animate-pulse"
          style={{
            backgroundColor: color,
            animationDelay: `${i * 150}ms`
          }}
        />
      ))}
    </div>
  )
};