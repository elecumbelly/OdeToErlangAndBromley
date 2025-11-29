import { cn } from '../../utils/cn';

import type { CSSProperties } from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  style?: CSSProperties;
}

export function Skeleton({ className, variant = 'text', width, height, style }: SkeletonProps) {
  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-apple',
  };

  return (
    <div
      className={cn(
        'animate-shimmer bg-gradient-to-r from-neutral-100 via-neutral-200 to-neutral-100 bg-[length:200%_100%]',
        variantStyles[variant],
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
    />
  );
}

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn('rounded-apple bg-white p-4 shadow-apple', className)}>
      <Skeleton className="mb-2 h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="mt-3 h-3 w-full" />
    </div>
  );
}

interface SkeletonChartProps {
  className?: string;
}

export function SkeletonChart({ className }: SkeletonChartProps) {
  return (
    <div className={cn('rounded-apple bg-white p-4 shadow-apple', className)}>
      <Skeleton className="mb-4 h-5 w-32" />
      <div className="flex items-end gap-2 h-40">
        {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
          <Skeleton key={i} className="flex-1" style={{ height: `${h}%` }} variant="rectangular" />
        ))}
      </div>
    </div>
  );
}
