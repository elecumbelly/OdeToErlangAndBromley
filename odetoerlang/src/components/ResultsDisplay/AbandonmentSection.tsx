import { memo } from 'react';
import { useCalculatorStore } from '../../store/calculatorStore';
import { formatNumber } from './resultsFormat';

export const AbandonmentSection = memo(() => {
  const { abandonmentMetrics, inputs } = useCalculatorStore();
  if (!abandonmentMetrics || inputs.model !== 'A') return null;

  return (
    <div className="mt-6 pt-5 border-t border-border-muted/30">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
        Abandonment
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center p-4 bg-amber/5 border border-amber/20 rounded-lg">
          <div>
            <p className="text-base text-text-primary font-medium">Abandon Rate</p>
            <p className="text-sm text-text-muted">{formatNumber(abandonmentMetrics.expectedAbandonments, 0)} contacts</p>
          </div>
          <p className="text-2xl font-bold text-amber tabular-nums">
            {formatNumber(abandonmentMetrics.abandonmentRate * 100, 1)}%
          </p>
        </div>

        <div className="flex justify-between items-center p-4 bg-green/5 border border-green/20 rounded-lg">
          <div>
            <p className="text-base text-text-primary font-medium">Answered</p>
            <p className="text-sm text-text-muted">{formatNumber((abandonmentMetrics.answeredContacts / inputs.volume) * 100, 1)}% of total</p>
          </div>
          <p className="text-2xl font-bold text-green tabular-nums">
            {formatNumber(abandonmentMetrics.answeredContacts, 0)}
          </p>
        </div>

        {abandonmentMetrics.retrialProbability !== undefined && (
          <>
            <div className="flex justify-between items-center p-4 bg-magenta/5 border border-magenta/20 rounded-lg">
              <div>
                <p className="text-base text-text-primary font-medium">Retrial Prob</p>
                <p className="text-sm text-text-muted">Callbacks</p>
              </div>
              <p className="text-2xl font-bold text-magenta tabular-nums">
                {formatNumber(abandonmentMetrics.retrialProbability * 100, 1)}%
              </p>
            </div>

            {abandonmentMetrics.virtualTraffic !== undefined && (
              <div className="flex justify-between items-center p-4 bg-blue/5 border border-blue/20 rounded-lg">
                <div>
                  <p className="text-base text-text-primary font-medium">Virtual Traffic</p>
                  <p className="text-sm text-text-muted">+retrials</p>
                </div>
                <p className="text-2xl font-bold text-blue tabular-nums">
                  {formatNumber(abandonmentMetrics.virtualTraffic, 2)}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});

AbandonmentSection.displayName = 'AbandonmentSection';
