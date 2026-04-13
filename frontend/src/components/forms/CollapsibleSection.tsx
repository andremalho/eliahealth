import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

interface Props {
  title: string;
  defaultOpen?: boolean;
  badge?: string;
  children: React.ReactNode;
}

export default function CollapsibleSection({ title, defaultOpen = false, badge, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-sm font-semibold text-navy hover:text-lilac transition"
      >
        <div className="flex items-center gap-2">
          <span className="uppercase tracking-wide text-xs">{title}</span>
          {badge && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-lilac/10 text-lilac">{badge}</span>
          )}
        </div>
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      <div className={cn('space-y-3 pb-4', !open && 'hidden')}>
        {children}
      </div>
    </div>
  );
}
