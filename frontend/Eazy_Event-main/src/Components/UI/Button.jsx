import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-md hover:shadow-lg border border-blue-600',
    secondary: 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500 shadow-md hover:shadow-lg border border-purple-600',
    accent: 'bg-yellow-500 text-gray-900 hover:bg-yellow-400 focus:ring-yellow-500 shadow-md hover:shadow-lg border border-yellow-500 font-semibold',
    outline: 'border-2 border-blue-600 dark:border-blue-400 bg-transparent text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white focus:ring-blue-500 shadow-sm hover:shadow-md',
    ghost: 'bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-gray-500 border border-transparent',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-md hover:shadow-lg border border-red-600',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-md hover:shadow-lg border border-green-600',
    warning: 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500 shadow-md hover:shadow-lg border border-orange-500'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  const classes = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${widthClass}
    ${className}
  `.trim();

  const IconComponent = icon;
  const LoadingIcon = Loader2;

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <LoadingIcon className="animate-spin h-4 w-4 mr-2" />
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <IconComponent className="h-4 w-4 mr-2" />
      )}
      
      {children}
      
      {!loading && icon && iconPosition === 'right' && (
        <IconComponent className="h-4 w-4 ml-2" />
      )}
    </button>
  );
};

export default Button;