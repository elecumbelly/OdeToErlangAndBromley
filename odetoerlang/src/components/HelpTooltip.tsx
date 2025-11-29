import * as TooltipPrimitive from '@radix-ui/react-tooltip';

interface HelpTooltipProps {
  content: string;
  example?: string;
  typical?: string;
  formula?: string;
  children: React.ReactNode;
}

export default function HelpTooltip({ content, example, typical, formula, children }: HelpTooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={300}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm z-50 animate-in fade-in-0 zoom-in-95"
            sideOffset={5}
          >
            <div className="space-y-2">
              <p className="text-sm font-medium">{content}</p>

              {example && (
                <div className="text-xs text-gray-300">
                  <span className="font-semibold text-blue-300">Example:</span> {example}
                </div>
              )}

              {typical && (
                <div className="text-xs text-gray-300">
                  <span className="font-semibold text-green-300">Typical:</span> {typical}
                </div>
              )}

              {formula && (
                <div className="text-xs font-mono text-yellow-300 bg-gray-800 px-2 py-1 rounded mt-2">
                  {formula}
                </div>
              )}
            </div>
            <TooltipPrimitive.Arrow className="fill-gray-900" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

// Info icon component for consistent help indicators
export function InfoIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`w-4 h-4 text-gray-400 hover:text-primary-600 cursor-help transition-colors ${className}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  );
}
