import { cn } from '../../utils/cn';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({ icon, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center text-center text-gray-400',
      compact ? 'py-8' : 'py-16',
      className,
    )}>
      <div className="mb-3">{icon}</div>
      <p className={cn('font-medium', compact ? 'text-sm' : 'text-base')}>{title}</p>
      {description && <p className={cn('mt-1', compact ? 'text-xs' : 'text-sm')}>{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
