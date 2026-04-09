import { useState, useRef, useEffect } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Botão de excluir com confirmação inline (popover).
 * Click 1: abre popover de confirmação
 * Click 2 em "Excluir": dispara onConfirm
 * Click fora ou Esc: cancela
 */
export function DeleteButton({
  onConfirm,
  isPending = false,
  label = 'Excluir registro',
  confirmLabel = 'Confirmar exclusão?',
  className,
}: {
  onConfirm: () => void;
  isPending?: boolean;
  label?: string;
  confirmLabel?: string;
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

  const handleConfirm = () => {
    setOpen(false);
    onConfirm();
  };

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
        title={label}
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </button>
      {open && (
        <div className="absolute z-50 right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-xs text-gray-700 mb-2">{confirmLabel}</p>
          <p className="text-[10px] text-gray-400 mb-3">Esta ação não pode ser desfeita.</p>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700"
            >
              Excluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
