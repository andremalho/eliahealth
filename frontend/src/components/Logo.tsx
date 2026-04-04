const appName = import.meta.env.VITE_APP_NAME ?? 'eliahealth';
const isWhiteLabel = import.meta.env.VITE_WHITE_LABEL === 'true';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizeMap = { sm: 'text-2xl', md: 'text-4xl', lg: 'text-5xl' };
  const circleSize = { sm: 'w-20 h-20', md: 'w-28 h-28', lg: 'w-36 h-36' };
  const dotSize = { sm: 'w-1.5 h-1.5', md: 'w-2 h-2', lg: 'w-2.5 h-2.5' };
  const dotOffset = { sm: '-top-0.5', md: '-top-1', lg: '-top-1' };

  if (isWhiteLabel) {
    return (
      <span className={`font-bold text-navy ${sizeMap[size]} ${className}`}>
        {appName}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div className={`${circleSize[size]} rounded-full border-[3px] border-lilac flex items-center justify-center`}>
        <span className={`font-bold text-navy ${sizeMap[size]} tracking-tight`}>
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
      </div>
    </div>
  );
}
