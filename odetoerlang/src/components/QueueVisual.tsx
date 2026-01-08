/**
 * Visual representation of the queue and servers
 */

import { type Server, type Customer } from '../simulation/types';

interface QueueVisualProps {
  servers: Server[];
  waitingQueue: Customer[];
  maxQueueDisplay?: number;
}

export default function QueueVisual({ servers, waitingQueue, maxQueueDisplay = 30 }: QueueVisualProps) {
  const displayedQueue = waitingQueue.slice(0, maxQueueDisplay);
  const queueOverflow = waitingQueue.length - displayedQueue.length;

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 shadow-sm relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan/[0.02] to-transparent pointer-events-none" />
      
      <h3 className="text-lg font-bold text-text-primary mb-6 tracking-wide">Live System View</h3>

      {/* Servers */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
            Agent Status
          </span>
          <span className="text-xs text-text-muted">
            {servers.filter(s => s.busy).length} / {servers.length} Busy
          </span>
        </div>
        
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-5 gap-3">
          {servers.map((server) => (
            <div
              key={server.id}
              className={`
                aspect-square rounded-xl border-2 flex flex-col items-center justify-center
                transition-all duration-300 relative overflow-hidden group
                ${server.busy
                  ? 'bg-green/10 border-green/50 text-green shadow-glow-green'
                  : 'bg-bg-elevated border-border-subtle text-text-muted hover:border-text-secondary'
                }
              `}
              title={server.busy ? `Serving customer ${server.customerId}` : 'Idle'}
            >
              <div className="text-[10px] font-mono opacity-60 mb-1">AG-{server.id + 1}</div>
              <div className={`text-xl transition-transform ${server.busy ? 'scale-110' : 'scale-100'}`}>
                {server.busy ? '👤' : '⚪'}
              </div>
              {server.busy && (
                <div className="absolute inset-0 bg-green/5 animate-pulse" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Waiting Queue */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
            Waiting Queue
          </span>
          <span className={`text-xs font-mono px-2 py-0.5 rounded ${waitingQueue.length > 5 ? 'bg-red/10 text-red' : 'bg-bg-elevated text-text-muted'}`}>
            Count: {waitingQueue.length}
          </span>
        </div>

        <div className="min-h-[100px] p-4 bg-bg-elevated/50 rounded-xl border border-border-muted flex flex-wrap content-start gap-2">
          {waitingQueue.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-text-muted opacity-50 py-4">
              <span className="text-2xl mb-2">✨</span>
              <span className="text-sm">Queue Empty</span>
            </div>
          ) : (
            <>
              {displayedQueue.map((customer) => (
                <div
                  key={customer.id}
                  className="w-8 h-8 rounded-full bg-cyan text-bg-base flex items-center justify-center text-[10px] font-bold shadow-sm animate-fade-in"
                  title={`Arrived: ${customer.arrivalTime.toFixed(1)}s`}
                >
                  {customer.id % 99}
                </div>
              ))}
              {queueOverflow > 0 && (
                <div className="w-8 h-8 rounded-full bg-bg-elevated border border-border-subtle text-text-secondary flex items-center justify-center text-[10px]">
                  +{queueOverflow}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Flow Legend */}
      <div className="mt-6 pt-4 border-t border-border-muted flex justify-center gap-6 text-xs text-text-muted">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan"></div>
          <span>Waiting</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green"></div>
          <span>In Call</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-bg-elevated border border-text-muted"></div>
          <span>Idle</span>
        </div>
      </div>
    </div>
  );
}
