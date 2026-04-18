const appName = import.meta.env.VITE_APP_NAME ?? 'elia·health';
const isWhiteLabel = import.meta.env.VITE_WHITE_LABEL === 'true';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light';
  product?: 'health' | 'mov';
  className?: string;
}

/**
 * elia·health / elia·mov brand lockup.
 * "elia" em Fraunces serif, ponto terracotta, sub-produto em Figtree tracked.
 */
export default function Logo({
  size = 'md',
  variant = 'dark',
  product = 'health',
  className = '',
}: LogoProps) {
  const sizeMap = {
    sm: { elia: 22, sub: 9,  dot: 3, gap: 5, dy: -2 },
    md: { elia: 34, sub: 14, dot: 5, gap: 8, dy: -4 },
    lg: { elia: 52, sub: 22, dot: 7, gap: 12, dy: -6 },
  }[size];

  const fg = variant === 'light' ? '#F5EFE6' : '#14161F';

  if (isWhiteLabel) {
    return (
      <span
        className={className}
        style={{
          fontFamily: "'Fraunces', serif",
          fontWeight: 500,
          fontSize: sizeMap.elia,
          color: fg,
          letterSpacing: '-0.025em',
        }}
      >
        {appName}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-baseline leading-none whitespace-nowrap ${className}`}
      style={{ color: fg }}
    >
      <span
        style={{
          fontFamily: "'Fraunces', serif",
          fontWeight: 450,
          fontVariationSettings: "'opsz' 96, 'SOFT' 40",
          fontSize: sizeMap.elia,
          letterSpacing: '-0.035em',
          lineHeight: 1,
        }}
      >
        elia
      </span>
      <span
        aria-hidden
        style={{
          display: 'inline-block',
          width: sizeMap.dot,
          height: sizeMap.dot,
          margin: `0 ${sizeMap.gap}px`,
          borderRadius: '50%',
          background: '#D97757',
          transform: `translateY(${sizeMap.dy}px)`,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: "'Figtree', sans-serif",
          fontWeight: 500,
          fontSize: sizeMap.sub,
          letterSpacing: '0.14em',
          textTransform: 'lowercase',
          color: fg,
          lineHeight: 1,
        }}
      >
        {product}
      </span>
    </span>
  );
}
