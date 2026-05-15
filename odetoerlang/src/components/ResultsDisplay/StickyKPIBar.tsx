import { memo, useEffect, useRef, useState } from 'react';
import { useCalculatorStore } from '../../store/calculatorStore';
import { formatNumber, formatTime, getStatusColor, getOccupancyColor } from './resultsFormat';

interface StickyKPIBarProps {
  visible: boolean;
}

export const StickyKPIBar = memo(({ visible }: StickyKPIBarProps) => {
  const { results, inputs, achievableMetrics } = useCalculatorStore();
  const [hiddenForScroll, setHiddenForScroll] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const SCROLL_THRESHOLD_PX = 10;
    const handleScroll = () => {
      const start = performance.now();
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;
      if (Math.abs(delta) > SCROLL_THRESHOLD_PX) {
        setHiddenForScroll(delta > 0);
        lastScrollY.current = currentY;
      }
      const duration = performance.now() - start;
      if (duration > 10) {
        console.debug('[perf] sticky scroll handler', duration.toFixed(2), 'ms');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible || !results) return null;

  const stickyMetrics = [
    { label: 'Agents', value: results.requiredAgents, color: 'text-cyan' },
    { label: 'SL', value: `${formatNumber(results.serviceLevel, 1)}%`, color: getStatusColor(results.serviceLevel, inputs.targetSLPercent) },
    { label: 'ASA', value: formatTime(results.asa), color: 'text-text-primary' },
    { label: 'Occ', value: `${formatNumber(results.occupancy, 1)}%`, color: getOccupancyColor(results.occupancy, inputs.maxOccupancy) },
  ];

  return (
    <div className={`sm:hidden fixed bottom-4 left-4 right-4 z-30 transition-transform duration-200 ${hiddenForScroll ? 'translate-y-24' : 'translate-y-0'}`}>
      <div className="bg-bg-surface/95 backdrop-blur-md border border-border-subtle/50 shadow-xl rounded-xl px-4 py-3 flex items-center justify-between gap-3 overflow-x-auto scrollbar-thin">
        {stickyMetrics.map((metric) => (
          <div key={metric.label} className="text-center min-w-[70px]">
            <p className="text-xs text-text-muted uppercase tracking-wide">{metric.label}</p>
            <p className={`text-base font-bold tabular-nums ${metric.color}`}>{metric.value}</p>
          </div>
        ))}
        {achievableMetrics?.occupancyCapApplied && (
          <span className="text-xs text-amber uppercase tracking-wide bg-amber/10 border border-amber/30 rounded-lg px-3 py-1.5">
            Cap
          </span>
        )}
      </div>
    </div>
  );
});

StickyKPIBar.displayName = 'StickyKPIBar';
