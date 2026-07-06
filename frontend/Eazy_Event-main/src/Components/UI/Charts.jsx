import React from 'react';

/**
 * Simple bar chart using SVG — no external library needed
 */
export const BarChart = ({ data = [], height = 200, color = '#3b82f6' }) => {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const barWidth = Math.max(20, Math.min(60, (300 / data.length)));
  const chartWidth = data.length * (barWidth + 8);

  return (
    <div className="overflow-x-auto">
      <svg width={Math.max(chartWidth, 300)} height={height + 40} className="mx-auto">
        {data.map((item, i) => {
          const barHeight = (item.value / max) * height;
          const x = i * (barWidth + 8) + 4;
          const y = height - barHeight;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx="4"
                className="transition-all duration-300 hover:opacity-80"
              />
              <text
                x={x + barWidth / 2}
                y={height + 16}
                textAnchor="middle"
                className="text-[10px] fill-gray-500 dark:fill-gray-400"
              >
                {item.label}
              </text>
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                className="text-[10px] fill-gray-700 dark:fill-gray-300 font-medium"
              >
                {item.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/**
 * Simple donut/ring chart using SVG
 */
export const DonutChart = ({ value = 0, max = 100, label = '', size = 120, color = '#3b82f6' }) => {
  const percentage = Math.min(100, (value / max) * 100);
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
        {label && <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>}
      </div>
    </div>
  );
};

/**
 * Stat with trend indicator
 */
export const StatTrend = ({ label, value, trend, trendLabel }) => {
  const isPositive = trend >= 0;
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      {trend !== undefined && (
        <span className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '↑' : '↓'} {Math.abs(trend)}% {trendLabel || ''}
        </span>
      )}
    </div>
  );
};
