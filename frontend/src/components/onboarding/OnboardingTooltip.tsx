import { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useOnboarding } from './useOnboarding';

interface Props {
  flowName: string;
}

export default function OnboardingTooltip({ flowName }: Props) {
  const { isActive, step, currentStep, totalSteps, next, skip } = useOnboarding(flowName);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !step) return;

    const el = document.querySelector(step.target);
    if (!el) {
      // Target not found — skip to next
      const timer = setTimeout(next, 200);
      return () => clearTimeout(timer);
    }

    const rect = el.getBoundingClientRect();
    setTargetRect(rect);

    const padding = 12;
    let top = 0;
    let left = 0;

    switch (step.position) {
      case 'bottom':
        top = rect.bottom + padding;
        left = rect.left + rect.width / 2 - 170;
        break;
      case 'top':
        top = rect.top - padding - 180;
        left = rect.left + rect.width / 2 - 170;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - 90;
        left = rect.left - padding - 340;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - 90;
        left = rect.right + padding;
        break;
    }

    setPosition({ top: Math.max(8, top), left: Math.max(8, left) });
  }, [isActive, step, next]);

  if (!isActive || !step) return null;

  const isLast = currentStep === totalSteps - 1;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9998] bg-black/40 pointer-events-auto" onClick={skip} />

      {/* Spotlight on target */}
      {targetRect && (
        <div
          className="fixed z-[9999] rounded-lg ring-4 ring-lilac/50 pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[10000] w-[340px] bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-gray-200 p-5 pointer-events-auto"
        style={{ top: position.top, left: position.left }}
      >
        <button onClick={skip} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>

        <h4 className="text-navy font-semibold text-sm mb-2">{step.title}</h4>
        <p className="text-gray-600 text-sm leading-relaxed">{step.content}</p>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          {/* Progress dots */}
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  i === currentStep ? 'bg-lilac' : i < currentStep ? 'bg-lilac/40' : 'bg-gray-200',
                )}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={skip} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1">
              Pular tour
            </button>
            <button
              onClick={next}
              className="text-xs bg-lilac text-white px-4 py-1.5 rounded-lg hover:bg-primary-dark font-medium"
            >
              {isLast ? 'Comecar' : 'Proximo'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
