/**
 * Visual representation of the queue and servers
 */

import { type Server, type Customer } from '../simulation/types';

interface QueueVisualProps {
  servers: Server[];
  waitingQueue: Customer[];
  maxQueueDisplay?: number;
}

export default function QueueVisual({ servers, waitingQueue, maxQueueDisplay = 20 }: QueueVisualProps) {
  const displayedQueue = waitingQueue.slice(0, maxQueueDisplay);
  const queueOverflow = waitingQueue.length - displayedQueue.length;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">System Visualisation</h3>

      {/* Servers */}
      <div className="mb-6">
        <div className="text-sm font-medium text-gray-700 mb-2">
          Servers ({servers.filter(s => s.busy).length}/{servers.length} busy)
        </div>
        <div className="flex flex-wrap gap-2">
          {servers.map((server) => (
            <div
              key={server.id}
              className={`
                w-16 h-16 rounded-lg border-2 flex items-center justify-center text-xs font-medium
                transition-all duration-300
                ${server.busy
                  ? 'bg-green-500 border-green-600 text-white'
                  : 'bg-gray-100 border-gray-300 text-gray-500'
                }
              `}
              title={server.busy ? `Serving customer ${server.customerId}` : 'Idle'}
            >
              <div className="text-center">
                <div className="text-[10px] opacity-75">S{server.id + 1}</div>
                {server.busy && (
                  <div className="text-sm font-bold mt-1">
                    👤
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Waiting Queue */}
      <div>
        <div className="text-sm font-medium text-gray-700 mb-2">
          Waiting Queue ({waitingQueue.length} customer{waitingQueue.length !== 1 ? 's' : ''})
        </div>
        {waitingQueue.length === 0 ? (
          <div className="text-gray-400 text-sm italic py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
            Queue is empty
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {displayedQueue.map((customer) => (
                <div
                  key={customer.id}
                  className="w-12 h-12 rounded-full bg-blue-500 border-2 border-blue-600 flex items-center justify-center text-white text-xs font-bold"
                  title={`Customer ${customer.id}, arrived at ${customer.arrivalTime.toFixed(2)}`}
                >
                  {customer.id}
                </div>
              ))}
            </div>
            {queueOverflow > 0 && (
              <div className="mt-2 text-sm text-gray-500 italic">
                ... and {queueOverflow} more
              </div>
            )}
          </>
        )}
      </div>

      {/* Flow Direction Indicator */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Waiting</span>
          </div>
          <div className="flex-1 mx-4 border-t-2 border-dashed border-gray-300"></div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-lg bg-green-500"></div>
            <span>In Service</span>
          </div>
          <div className="flex-1 mx-4 border-t-2 border-dashed border-gray-300"></div>
          <div className="flex items-center space-x-2">
            <span>Completed</span>
            <div className="text-lg">✓</div>
          </div>
        </div>
      </div>
    </div>
  );
}
