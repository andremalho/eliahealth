import { cn } from '../../utils/cn';

interface Tab {
  key: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex border-b border-gray-200', className)}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              'flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              isActive
                ? 'border-lilac text-lilac bg-lilac/5'
                : 'border-transparent text-gray-500 hover:text-navy hover:bg-gray-50',
            )}
            role="tab"
            aria-selected={isActive}
          >
            {tab.icon}
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className={cn(
                'ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full',
                isActive ? 'bg-lilac/20 text-lilac' : 'bg-gray-100 text-gray-500',
              )}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
