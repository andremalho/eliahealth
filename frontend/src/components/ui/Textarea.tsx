import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, required, className, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s/g, '-');
    return (
      <div>
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-medium text-gray-600 mb-1.5">
            {label}{required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full px-3 py-2.5 border rounded-lg text-sm text-gray-800 placeholder:text-gray-400 resize-none',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac',
            'disabled:bg-gray-50 disabled:text-gray-500',
            error ? 'border-red-300' : 'border-gray-300',
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
export { Textarea };
