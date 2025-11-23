import { useEffect } from 'react';
import InputPanel from './components/InputPanel';
import ResultsDisplay from './components/ResultsDisplay';
import { useCalculatorStore } from './store/calculatorStore';

function App() {
  const calculate = useCalculatorStore((state) => state.calculate);

  // Calculate on initial load
  useEffect(() => {
    calculate();
  }, [calculate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              OdeToErlang
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Contact Center Capacity Planning Calculator • Erlang C Formula
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="mb-8 p-4 bg-blue-600 text-white rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2">👋 Welcome to OdeToErlang!</h2>
          <p className="text-sm opacity-90">
            This tool calculates staffing requirements for contact centers using the mathematically correct
            <strong> Erlang C formula</strong>. Adjust the parameters on the left to see real-time results.
            All calculations happen instantly in your browser.
          </p>
        </div>

        {/* Calculator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <InputPanel />
          </div>
          <div>
            <ResultsDisplay />
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">About the Erlang C Formula</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              The <strong>Erlang C formula</strong> is the industry standard for calculating contact center staffing requirements.
              Developed in 1917 by Agner Krarup Erlang, it models queuing systems where customers wait for the next available agent.
            </p>
            <p className="mt-3">
              <strong>Key Assumptions:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1 text-gray-600">
              <li>Customers have infinite patience (never abandon)</li>
              <li>Calls arrive randomly (Poisson distribution)</li>
              <li>Handle times follow exponential distribution</li>
              <li>All agents are identical in skill level</li>
            </ul>
            <p className="mt-3 text-xs text-gray-500">
              <strong>Formula:</strong> P(wait &gt; t) = P(wait &gt; 0) × e<sup>-(c-A)×t/AHT</sup>
              <br />
              Where: c = agents, A = traffic intensity (Erlangs), t = threshold time, AHT = average handle time
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>
            Built with ❤️ for WFM professionals •
            <a href="https://github.com/elecumbelly/OdeToErlang" className="text-primary-600 hover:text-primary-700 ml-1">
              View on GitHub
            </a>
          </p>
          <p className="mt-1">
            © 2025 SteS • MIT License • 100% Browser-Based • No Data Stored
          </p>
        </footer>
      </main>
    </div>
  );
}

export default App;
