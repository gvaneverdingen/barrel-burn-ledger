import arigiMark from '@/assets/arigi-mark.png';
import { cn } from '@/lib/utils';

// The winged-cask mark as an alpha mask, filled with the theme's primary
// colour: champagne on navy, old gold on parchment.
export const ArigiMark = ({ className }: { className?: string }) => (
  <span
    role="img"
    aria-label="ARIGI logo"
    className={cn('inline-block shrink-0 bg-primary', className)}
    style={{
      WebkitMaskImage: `url(${arigiMark})`,
      maskImage: `url(${arigiMark})`,
      WebkitMaskSize: 'contain',
      maskSize: 'contain',
      WebkitMaskRepeat: 'no-repeat',
      maskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center',
      maskPosition: 'center',
    }}
  />
);
