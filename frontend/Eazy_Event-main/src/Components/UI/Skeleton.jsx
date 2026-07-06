import React from 'react';

const Skeleton = ({ 
  className = '', 
  variant = 'text', 
  width = '100%', 
  height = '1rem',
  lines = 1,
  ...props 
}) => {
  const baseClasses = 'relative overflow-hidden bg-gray-200 dark:bg-gray-700 rounded before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent';
  
  const variants = {
    text: 'h-4',
    title: 'h-6',
    avatar: 'rounded-full',
    image: 'h-48',
    button: 'h-10',
    card: 'h-64'
  };

  if (lines > 1) {
    return (
      <div className={className} {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${variants[variant]} ${
              index < lines - 1 ? 'mb-2' : ''
            }`}
            style={{ width: index === lines - 1 ? '75%' : width }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${variants[variant]} ${className}`}
      style={{ width, height }}
      {...props}
    />
  );
};

// Skeleton components for common use cases
export const EventCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
    <Skeleton variant="image" className="w-full h-48" />
    <div className="p-6">
      <div className="flex gap-2 mb-3">
        <Skeleton width="60px" height="24px" className="rounded-full" />
        <Skeleton width="80px" height="24px" className="rounded-full" />
      </div>
      <Skeleton variant="title" width="90%" className="mb-2" />
      <Skeleton lines={2} className="mb-4" />
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Skeleton variant="avatar" width="32px" height="32px" className="mr-3" />
          <div>
            <Skeleton width="100px" className="mb-1" />
            <Skeleton width="60px" height="12px" />
          </div>
        </div>
        <Skeleton width="60px" height="32px" className="rounded" />
      </div>
    </div>
  </div>
);

export const EventGridSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <EventCardSkeleton key={index} />
    ))}
  </div>
);

export default Skeleton;