const appName = import.meta.env.VITE_APP_NAME ?? 'eliahealth';
const isWhiteLabel = import.meta.env.VITE_WHITE_LABEL === 'true';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizeMap = { sm: 'text-3xl', md: 'text-[48px]', lg: 'text-[56px]' };
  const dotSize = { sm: 'w-1.5 h-1.5', md: 'w-2 h-2', lg: 'w-2.5 h-2.5' };
  const dotOffset = { sm: '-top-0.5', md: '-top-1', lg: '-top-1.5' };

  if (isWhiteLabel) {
    return (
      <span className={`font-bold text-navy ${sizeMap[size]} ${className}`}>
        {appName}
      </span>
    );
  }

  return (
    <span className={`font-bold text-navy ${sizeMap[size]} tracking-tight leading-none whitespace-nowrap ${className}`}>
      el
      <span className="relative inline-block">
        <span className="invisible">i</span>
        <span className="absolute inset-0 flex flex-col items-center justify-end">
          <span className={`${dotSize[size]} rounded-full bg-lilac ${dotOffset[size]} absolute`} />
          <span className="text-navy">ı</span>
        </span>
      </span>
      ahealth
    </span>
  );
}
