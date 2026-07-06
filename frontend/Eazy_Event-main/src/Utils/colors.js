// Unified Color Scheme for the entire application
export const colors = {
  // Primary Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Secondary Colors (Purple)
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7', // Main purple
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },
  
  // Accent Colors (Yellow/Orange)
  accent: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Main yellow
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Neutral Colors
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // Status Colors
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
  },
  
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
};

// Gradient definitions
export const gradients = {
  primary: 'from-blue-600 via-purple-600 to-indigo-700',
  hero: 'from-blue-600 via-purple-600 to-indigo-700',
  card: 'from-white to-gray-50',
  button: 'from-blue-600 to-blue-700',
  accent: 'from-yellow-400 to-orange-500',
};

// Button color schemes
export const buttonVariants = {
  primary: {
    base: 'bg-blue-600 text-white',
    hover: 'hover:bg-blue-700',
    focus: 'focus:ring-blue-500',
    shadow: 'shadow-sm hover:shadow-md',
  },
  secondary: {
    base: 'bg-purple-600 text-white',
    hover: 'hover:bg-purple-700',
    focus: 'focus:ring-purple-500',
    shadow: 'shadow-sm hover:shadow-md',
  },
  accent: {
    base: 'bg-yellow-500 text-gray-900',
    hover: 'hover:bg-yellow-400',
    focus: 'focus:ring-yellow-500',
    shadow: 'shadow-sm hover:shadow-md',
  },
  outline: {
    base: 'border-2 border-blue-600 bg-transparent text-blue-600',
    hover: 'hover:bg-blue-600 hover:text-white',
    focus: 'focus:ring-blue-500',
    shadow: 'shadow-sm hover:shadow-md',
  },
  ghost: {
    base: 'bg-transparent text-gray-700',
    hover: 'hover:bg-gray-100',
    focus: 'focus:ring-gray-500',
    shadow: '',
  },
  danger: {
    base: 'bg-red-600 text-white',
    hover: 'hover:bg-red-700',
    focus: 'focus:ring-red-500',
    shadow: 'shadow-sm hover:shadow-md',
  },
  success: {
    base: 'bg-green-600 text-white',
    hover: 'hover:bg-green-700',
    focus: 'focus:ring-green-500',
    shadow: 'shadow-sm hover:shadow-md',
  },
};

export default colors;