import { cn } from '../../utils/cn';

interface StatProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export function Stat({ label, value, icon, color = 'bg-lilac/10 text-lilac', trend, className }: StatProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 shadow-sm p-5', className)}>
      {icon && (
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center mb-3', color)}>
          {icon}
        </div>
      )}
      <p className="text-2xl font-bold text-navy">{value}</p>
      <div className="flex items-center gap-2 mt-0.5">
        <p className="text-sm text-gray-500">{label}</p>
        {trend && (
          <span className={cn('text-xs font-medium', trend.positive ? 'text-emerald-600' : 'text-red-600')}>
            {trend.positive ? '+' : ''}{trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
