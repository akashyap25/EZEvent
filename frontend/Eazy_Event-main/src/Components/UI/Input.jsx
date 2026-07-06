import React, { forwardRef } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

const Input = forwardRef(({
  label,
  error,
  helperText,
  type = 'text',
  showPasswordToggle = false,
  leftIcon,
  rightIcon,
  className = '',
  labelClassName = '',
  inputClassName = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const inputType = type === 'password' && showPassword ? 'text' : type;
  const hasError = !!error;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${hasError ? 'text-red-600 dark:text-red-400' : ''} ${labelClassName}`}>
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      
      <div className="relative group">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          type={inputType}
          className={`
            block w-full h-11 px-4 rounded-xl border text-sm
            bg-gray-50 dark:bg-gray-800/50
            text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            transition-all duration-200 ease-out
            focus:outline-none focus:bg-white dark:focus:bg-gray-800
            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400
            hover:border-gray-400 dark:hover:border-gray-500
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300
            ${leftIcon ? 'pl-11' : ''}
            ${rightIcon || (type === 'password' && showPasswordToggle) ? 'pr-11' : ''}
            ${hasError 
              ? 'border-red-400 dark:border-red-600 focus:border-red-500 focus:ring-red-500/20 bg-red-50/50 dark:bg-red-900/10' 
              : 'border-gray-200 dark:border-gray-700'
            }
            ${inputClassName}
          `.trim()}
          {...props}
        />
        
        {type === 'password' && showPasswordToggle && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
        
        {rightIcon && type !== 'password' && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <div className="flex items-start gap-1.5 mt-1.5">
          {error ? (
            <>
              <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
