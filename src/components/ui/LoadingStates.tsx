import React from 'react';

export const LoadingSpinner: React.FC<{ size?: number; className?: string }> = ({ 
  size = 40, 
  className = '' 
}) => (
  <div className={`flex justify-center items-center ${className}`}>
    <div 
      className="animate-spin rounded-full border-b-2 border-blue-600"
      style={{ width: size, height: size }}
    />
  </div>
);

export const SkeletonLoader: React.FC<{ 
  count?: number; 
  height?: string;
  className?: string;
}> = ({ count = 1, height = 'h-4', className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        className={`${height} bg-gray-200 rounded animate-pulse`}
      />
    ))}
  </div>
);

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="bg-white rounded-lg shadow p-6">
        <SkeletonLoader height="h-8" count={1} className="mb-4" />
        <SkeletonLoader height="h-4" count={2} />
      </div>
    ))}
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <SkeletonLoader height="h-6" count={1} className="mb-6 w-1/3" />
    <div className="h-64 bg-gray-100 rounded animate-pulse" />
  </div>
);

export const LoadingOverlay: React.FC<{ message?: string }> = ({ 
  message = 'Loading...' 
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full">
      <LoadingSpinner size={60} className="mb-4" />
      <p className="text-center text-gray-700 font-medium">{message}</p>
    </div>
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, description, icon, action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    {icon && (
      <div className="text-gray-400 mb-4">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    {description && (
      <p className="text-gray-500 text-center max-w-md mb-4">{description}</p>
    )}
    {action && (
      <div className="mt-4">
        {action}
      </div>
    )}
  </div>
);