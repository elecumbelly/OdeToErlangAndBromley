import { useState } from 'react';
import { useCalculatorStore } from '../store/calculatorStore';

export default function EducationalMode() {
  const { inputs, results } = useCalculatorStore();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  if (!results) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Perform a calculation to see educational breakdown</p>
      </div>
    );
  }

  const sections = [
    {
      id: 'overview',
      title: '📚 What is Erlang C?',
      content: (
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong>Erlang C</strong> is a mathematical formula developed by A.K. Erlang in 1917 to calculate
            waiting times in telephone queuing systems. It remains the foundation of contact center workforce management.
          </p>
          <p>
            <strong>Key Assumption:</strong> Customers have infinite patience and never abandon the queue.
            This means Erlang C typically <em>overestimates</em> service level by 5-15% compared to real-world scenarios.
          </p>
          <p>
            <strong>Use Cases:</strong> Basic staffing calculations, quick estimates, and situations where abandonment is very low.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mt-2">
            <p className="text-xs text-blue-900">
              <strong>💡 Pro Tip:</strong> For more accurate results, use Erlang A (accounts for abandonment)
              or Erlang X (includes retrials and time-varying patterns).
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'step1',
      title: 'Step 1: Calculate Traffic Intensity (Erlangs)',
      content: (
        <div className="space-y-3 text-sm">
          <p className="text-gray-700">
            <strong>Traffic Intensity (A)</strong> measures the continuous workload in terms of agent-hours needed.
            One Erlang = continuous work for one agent.
          </p>

          <div className="bg-gray-50 p-4 rounded-lg font-mono text-xs">
            <div className="text-gray-600 mb-2">Formula:</div>
            <div className="text-lg text-gray-900">A = (Volume × AHT) / Interval</div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-gray-600 mb-2 text-xs">Your Calculation:</div>
            <div className="space-y-1 font-mono text-xs">
              <div>A = ({inputs.volume} calls × {inputs.aht} seconds) / {inputs.intervalMinutes * 60} seconds</div>
              <div>A = {inputs.volume * inputs.aht} / {inputs.intervalMinutes * 60}</div>
              <div className="text-lg font-bold text-green-700">A = {results.trafficIntensity.toFixed(2)} Erlangs</div>
            </div>
          </div>

          <p className="text-gray-600 text-xs">
            <strong>Interpretation:</strong> You need <strong>{results.trafficIntensity.toFixed(2)}</strong> agents
            worth of continuous work. Therefore, you need <em>at least</em> {Math.ceil(results.trafficIntensity)} agents
            to prevent an unstable queue (where wait times grow infinitely).
          </p>
        </div>
      )
    },
    {
      id: 'step2',
      title: 'Step 2: Apply Erlang C Formula',
      content: (
        <div className="space-y-3 text-sm">
          <p className="text-gray-700">
            The Erlang C formula calculates <strong>P(wait &gt; 0)</strong> - the probability that a contact
            must wait in queue (all agents are busy).
          </p>

          <div className="bg-gray-50 p-4 rounded-lg font-mono text-xs">
            <div className="text-gray-600 mb-2">Erlang C Formula (simplified):</div>
            <div className="space-y-1">
              <div>P(wait) = erlang_c(agents, traffic_intensity)</div>
              <div className="text-xs text-gray-500 mt-2">
                (Uses iterative method to avoid factorial overflow)
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-xs text-gray-700 mb-2">
              <strong>Service Level Calculation:</strong> To find SL, we calculate the probability
              that wait time exceeds the threshold:
            </p>
            <div className="font-mono text-xs">
              <div>P(wait &gt; t) = P(wait) × e^(-(c-A)×t/AHT)</div>
              <div className="mt-2">SL = 1 - P(wait &gt; {inputs.thresholdSeconds}s)</div>
            </div>
          </div>

          <p className="text-gray-600 text-xs mt-3">
            <strong>Your Target:</strong> {inputs.targetSLPercent}% of calls answered in {inputs.thresholdSeconds} seconds
          </p>
          <p className="text-gray-600 text-xs">
            <strong>Agents Required:</strong> Iteratively testing agent counts until SL ≥ {inputs.targetSLPercent}%
          </p>
          <div className="bg-green-50 p-3 rounded-lg mt-2">
            <div className="text-lg font-bold text-green-700">
              Result: {results.requiredAgents} productive agents needed
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Achieves {(results.serviceLevel * 100).toFixed(1)}% service level
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'step3',
      title: 'Step 3: Apply Shrinkage',
      content: (
        <div className="space-y-3 text-sm">
          <p className="text-gray-700">
            <strong>Shrinkage</strong> accounts for paid time when agents are NOT available to handle contacts:
          </p>

          <ul className="list-disc list-inside text-gray-600 text-xs space-y-1 ml-2">
            <li>Breaks (coffee, restroom): ~8%</li>
            <li>Lunch: ~4%</li>
            <li>Training & coaching: ~5%</li>
            <li>Meetings & team huddles: ~3%</li>
            <li>Absenteeism (sick, PTO): ~4%</li>
            <li><strong>Total typical shrinkage: 20-35%</strong></li>
          </ul>

          <div className="bg-gray-50 p-4 rounded-lg font-mono text-xs mt-3">
            <div className="text-gray-600 mb-2">Formula:</div>
            <div className="text-lg">Total FTE = Productive Agents / (1 - Shrinkage%)</div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg mt-3">
            <div className="text-gray-600 mb-2 text-xs">Your Calculation:</div>
            <div className="space-y-1 font-mono text-xs">
              <div>Total FTE = {results.requiredAgents} / (1 - {inputs.shrinkagePercent / 100})</div>
              <div>Total FTE = {results.requiredAgents} / {(1 - inputs.shrinkagePercent / 100).toFixed(2)}</div>
              <div className="text-lg font-bold text-green-700 mt-2">
                Total FTE = {results.totalFTE.toFixed(2)}
              </div>
            </div>
          </div>

          <p className="text-gray-600 text-xs mt-3">
            <strong>Interpretation:</strong> You need to schedule <strong>{results.totalFTE.toFixed(2)} FTE</strong>
            (full-time equivalents) so that after accounting for {inputs.shrinkagePercent}% shrinkage,
            you have {results.requiredAgents} agents actually available to handle contacts.
          </p>
        </div>
      )
    },
    {
      id: 'metrics',
      title: 'Step 4: Additional Metrics',
      content: (
        <div className="space-y-3 text-sm">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="font-semibold text-gray-900 mb-2">Average Speed of Answer (ASA)</div>
            <div className="font-mono text-xs mb-2">
              ASA = (P(wait) × AHT) / (agents - traffic)
            </div>
            <div className="text-lg font-bold text-blue-700">
              {results.asa.toFixed(0)} seconds ({(results.asa / 60).toFixed(1)} minutes)
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Average wait time for contacts that must queue. Lower is better.
            </p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="font-semibold text-gray-900 mb-2">Agent Occupancy</div>
            <div className="font-mono text-xs mb-2">
              Occupancy = Traffic Intensity / Agents
            </div>
            <div className="text-lg font-bold text-purple-700">
              {(results.occupancy * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Percentage of time agents are busy handling contacts.
              Target: 85-90% for voice (higher = risk of burnout).
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'limitations',
      title: '⚠️ Erlang C Limitations & Alternatives',
      content: (
        <div className="space-y-3 text-sm text-gray-700">
          <div className="bg-red-50 border-l-4 border-red-500 p-3">
            <div className="font-semibold text-red-900 mb-2">Limitations of Erlang C:</div>
            <ul className="list-disc list-inside text-xs space-y-1">
              <li>Assumes infinite patience - customers never abandon</li>
              <li>Overestimates service level by 5-15% in typical contact centers</li>
              <li>Doesn't account for retrials (customers calling back)</li>
              <li>Assumes constant arrival rate (not realistic for intraday patterns)</li>
              <li>Assumes all agents have identical skill levels</li>
            </ul>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 p-3">
            <div className="font-semibold text-green-900 mb-2">Better Alternatives:</div>

            <div className="mb-3">
              <div className="font-semibold text-sm">Erlang A (2004)</div>
              <p className="text-xs text-gray-600">
                Accounts for customer abandonment with a patience parameter.
                More accurate than Erlang C. Accuracy: ±5%.
              </p>
            </div>

            <div>
              <div className="font-semibold text-sm">Erlang X (2012+)</div>
              <p className="text-xs text-gray-600">
                Most accurate model - includes abandonment, retrials, and time-varying arrivals.
                Used in professional WFM tools. Accuracy: ±2%.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-gray-700">
              <strong>Recommendation:</strong> Use Erlang C for quick estimates and planning.
              For production staffing decisions, validate with Erlang A or X, or use historical data
              to calibrate your assumptions.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'references',
      title: '📖 References & Further Reading',
      content: (
        <div className="space-y-2 text-xs text-gray-700">
          <div>
            <strong>Original Papers:</strong>
            <ul className="list-disc list-inside ml-2 space-y-1 mt-1">
              <li>Erlang, A.K. (1917) - "Solution of some Problems in the Theory of Probabilities"</li>
              <li>Garnett, Mandelbaum & Reiman (2002) - "Designing a Call Center with Impatient Customers"</li>
            </ul>
          </div>

          <div>
            <strong>Recommended Books:</strong>
            <ul className="list-disc list-inside ml-2 space-y-1 mt-1">
              <li>"Call Center Management on Fast Forward" by Brad Cleveland</li>
              <li>"Queueing Systems" by Leonard Kleinrock</li>
            </ul>
          </div>

          <div>
            <strong>Online Resources:</strong>
            <ul className="list-disc list-inside ml-2 space-y-1 mt-1">
              <li>Wikipedia: Erlang (unit) - Mathematical foundations</li>
              <li>Contact Center Pipeline - Industry best practices</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="bg-primary-100 p-2 rounded-lg">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Educational Mode</h3>
            <p className="text-sm text-gray-600">Learn how Erlang C calculations work step-by-step</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {sections.map(section => (
          <div key={section.id}>
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900 text-left">{section.title}</span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.has(section.id) ? 'transform rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedSections.has(section.id) && (
              <div className="px-6 pb-6">
                {section.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
