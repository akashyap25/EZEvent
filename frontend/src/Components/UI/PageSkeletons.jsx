import React from 'react';

/**
 * Page-level skeleton layouts for common patterns
 */

export const EventGridSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700/50 overflow-hidden shadow-sm">
        <div className="h-48 bg-gray-200 dark:bg-gray-700 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent" />
        <div className="p-6 space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          <div className="flex justify-between items-center pt-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            </div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const ProfileSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
    <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent" />
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-100 dark:border-gray-700/50">
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-3" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto mb-1" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mx-auto" />
        </div>
      ))}
    </div>
  </div>
);

export const TasksSkeleton = () => (
  <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6" />
    <div className="grid grid-cols-5 gap-4 mb-6">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700/50">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-8" />
        </div>
      ))}
    </div>
    {[1,2,3,4].map(i => (
      <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700/50 flex items-center gap-4">
        <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
      </div>
    ))}
  </div>
);

export const DashboardSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2" />
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6" />
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700/50 flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-8" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          </div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1,2].map(i => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-100 dark:border-gray-700/50 space-y-4">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          {[1,2,3].map(j => (
            <div key={j} className="h-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  </div>
);
