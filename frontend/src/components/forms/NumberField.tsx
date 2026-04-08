import { forwardRef, useRef, useImperativeHandle } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Campo numérico com botões +/- explícitos.
 * Substitui o spinner nativo do <input type="number"> que tem inconsistências
 * entre browsers (Safari não mostra; alguns ambientes registram o click sem
 * atualizar o valor — bug que motivou esse componente).
 *
 * Compatível com react-hook-form via {...register('field')}: recebe e
 * encaminha o ref corretamente. Os botões disparam um evento 'input' nativo
 * para que o RHF capture a mudança.
 */
export interface NumberFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  step?: number;
  min?: number;
  max?: number;
  hasError?: boolean;
}

export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(
  function NumberField(
    { step = 1, min, max, hasError = false, className, ...rest },
    forwardedRef,
  ) {
    const internalRef = useRef<HTMLInputElement | null>(null);

    // Permite que o pai (RHF) acesse o input via forwardedRef
    useImperativeHandle(
      forwardedRef,
      () => internalRef.current as HTMLInputElement,
      [],
    );

    const dispatchValue = (newValue: string) => {
      const el = internalRef.current;
      if (!el) return;
      // Native setter para React/RHF detectarem a mudança
      const proto = window.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      setter?.call(el, newValue);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const adjust = (delta: number) => {
      const el = internalRef.current;
      if (!el) return;
      const raw = el.value;
      const current = parseFloat(raw || '0');
      let next = (isNaN(current) ? 0 : current) + delta;
      if (typeof min === 'number' && next < min) next = min;
      if (typeof max === 'number' && next > max) next = max;
      const decimals = step.toString().split('.')[1]?.length ?? 0;
      const newValue = decimals > 0 ? next.toFixed(decimals) : String(next);
      dispatchValue(newValue);
    };

    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => adjust(-step)}
          className="shrink-0 w-9 h-10 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 hover:border-lilac hover:text-lilac transition"
          tabIndex={-1}
          aria-label="Diminuir"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          {...rest}
          ref={internalRef}
          type="number"
          step={step}
          min={min}
          max={max}
          className={cn(
            'w-full px-3 py-2.5 border rounded-lg text-sm text-gray-800 text-center placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-lilac/30 focus:border-lilac transition',
            hasError ? 'border-red-400' : 'border-gray-300',
            className,
          )}
        />
        <button
          type="button"
          onClick={() => adjust(step)}
          className="shrink-0 w-9 h-10 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 hover:border-lilac hover:text-lilac transition"
          tabIndex={-1}
          aria-label="Aumentar"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    );
  },
);
