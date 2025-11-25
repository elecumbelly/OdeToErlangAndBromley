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

// Glossary terms with tooltips
export const glossary = {
  serviceLevel: {
    content: "Percentage of contacts answered within a target time threshold",
    example: "80/20 means 80% of calls answered in 20 seconds",
    typical: "Voice: 80/20, Email: 90/24hrs, Chat: 85/60sec",
    formula: "SL = 1 - P(wait > threshold)"
  },
  asa: {
    content: "Average Speed of Answer - Mean wait time for answered contacts",
    example: "If ASA is 15 seconds, average customer waits 15s before agent answers",
    typical: "Good ASA for voice: 10-30 seconds",
    formula: "ASA = (P(wait) × AHT) / (agents - traffic)"
  },
  aht: {
    content: "Average Handle Time - Mean duration of a contact from answer to completion",
    example: "4 minutes = 240 seconds (talk time + after-call work)",
    typical: "Voice: 3-6 min, Chat: 3-5 min, Email: 4-8 min",
    formula: "AHT = Talk Time + After Call Work"
  },
  occupancy: {
    content: "Percentage of time agents spend handling contacts vs being idle/available",
    example: "85% occupancy means agents are busy 85% of the time",
    typical: "Voice: 85-90%, Digital: can exceed 100% (concurrent)",
    formula: "Occupancy = Traffic Intensity / Agents"
  },
  shrinkage: {
    content: "Percentage of paid time NOT available for handling contacts",
    example: "25% shrinkage = breaks, lunch, training, meetings, absenteeism",
    typical: "Typical range: 20-35%, average ~25%",
    formula: "Total FTE = Productive Agents / (1 - Shrinkage%)"
  },
  trafficIntensity: {
    content: "Traffic load measured in Erlangs - represents continuous agent demand",
    example: "10 Erlangs means continuous work for 10 agents",
    typical: "Must be less than agent count for stable queue",
    formula: "A = (Volume × AHT) / Interval"
  },
  erlangC: {
    content: "Mathematical formula for calculating queue wait times with infinite patience",
    example: "Used to find staffing levels for target service level",
    typical: "Assumes customers never abandon - overestimates SL by 5-15%",
    formula: "P(wait) = Erlang C(agents, traffic)"
  },
  erlangA: {
    content: "Improved formula accounting for customer abandonment/impatience",
    example: "More accurate than Erlang C for real-world contact centers",
    typical: "Requires patience parameter (avg wait tolerance)",
    formula: "Includes abandonment parameter θ = patience/AHT"
  },
  threshold: {
    content: "Time limit for service level calculation",
    example: "20 seconds for 80/20 service level target",
    typical: "Voice: 15-30s, Chat: 30-90s, Email: 4-24 hrs",
    formula: "SL = % answered within threshold"
  },
  fte: {
    content: "Full-Time Equivalent - Standard unit of staffing",
    example: "1 FTE = one person working full-time schedule (typically 40 hrs/week)",
    typical: "Includes shrinkage - productive FTE is lower",
    formula: "FTE = Hours Required / 40"
  },
  abandonment: {
    content: "Contacts that disconnect before being answered",
    example: "Customer hangs up after waiting 45 seconds",
    typical: "Healthy: <5%, Warning: 5-10%, Critical: >10%",
    formula: "Abandon Rate = Abandoned / Total Offered"
  },
  patience: {
    content: "Average time a customer will wait before abandoning",
    example: "Average patience of 60 seconds means half abandon before 60s",
    typical: "Voice: 30-90s, depends on reason for call",
    formula: "θ (theta) = Average Patience / AHT"
  },
  concurrency: {
    content: "Number of contacts an agent handles simultaneously",
    example: "Chat agent handles 3 conversations at once",
    typical: "Voice: 1, Chat: 2-4, Email: 5-10",
    formula: "Effective AHT = AHT / Concurrency"
  },
  blending: {
    content: "Multi-skilled agents handling multiple channel types",
    example: "Agents can handle voice, chat, and email as needed",
    typical: "10-20% efficiency gain vs dedicated teams",
    formula: "Pooling reduces staff through flexibility"
  }
};
