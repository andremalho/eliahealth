import { forwardRef } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onClear?: () => void;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, value, ...props }, ref) => (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        ref={ref}
        type="search"
        value={value}
        className={cn(
          'w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm',
          'placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac',
          'transition-all duration-150',
          className,
        )}
        {...props}
      />
    </div>
  ),
);

SearchInput.displayName = 'SearchInput';
export { SearchInput };
