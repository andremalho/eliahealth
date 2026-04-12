import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  required?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, required, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-');
    return (
      <div>
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-gray-600 mb-1.5">
            {label}{required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full border rounded-lg text-sm text-gray-800 placeholder:text-gray-400',
              'transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac',
              'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
              icon ? 'pl-10 pr-3 py-2.5' : 'px-3 py-2.5',
              error ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-gray-300',
              className,
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
        </div>
        {error && <p id={`${inputId}-error`} className="mt-1 text-xs text-red-500">{error}</p>}
        {hint && !error && <p id={`${inputId}-hint`} className="mt-1 text-xs text-gray-400">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
export { Input };
