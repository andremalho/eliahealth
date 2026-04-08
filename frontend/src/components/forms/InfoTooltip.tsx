import { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Ícone "?" clicável que mostra um popover com texto explicativo.
 * Fecha ao clicar fora ou pressionar Esc.
 */
export function InfoTooltip({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span ref={containerRef} className={cn('relative inline-block', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center text-gray-400 hover:text-lilac transition align-middle"
        aria-label="Mais informações"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 w-72 max-w-[90vw] bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs text-gray-700 leading-relaxed">
          {title && (
            <p className="font-semibold text-navy mb-1">{title}</p>
          )}
          {children}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-gray-200 rotate-45" />
        </div>
      )}
    </span>
  );
}
