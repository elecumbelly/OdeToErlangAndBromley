import type { SVGProps } from 'react';

interface CwfLogoProps extends Omit<SVGProps<SVGSVGElement>, 'viewBox'> {
  /** Pixel size for both width and height. The geometry scales to fit. */
  size?: number;
  /**
   * Light-background variant. Per brand: silver rings become black; yellow ring
   * stays yellow.
   */
  light?: boolean;
}

const SILVER = '#E6E6E9';
const BLACK = '#000000';
const YELLOW = '#FFEF00';

export function CwfLogo({ size = 32, light = false, ...rest }: CwfLogoProps) {
  const ringColor = light ? BLACK : SILVER;
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      role="img"
      aria-label="Collapsing Wave Functions mark"
      {...rest}
    >
      <circle cx="50" cy="50" r="46" fill="none" stroke={ringColor} strokeWidth="2.5" />
      <circle cx="50" cy="50" r="36" fill="none" stroke={ringColor} strokeWidth="2.5" />
      <circle cx="50" cy="50" r="26" fill="none" stroke={YELLOW} strokeWidth="3.5" />
      <circle cx="50" cy="50" r="16" fill="none" stroke={ringColor} strokeWidth="2.5" />
      <circle cx="50" cy="50" r="6" fill="none" stroke={ringColor} strokeWidth="2.5" />
    </svg>
  );
}

export default CwfLogo;
