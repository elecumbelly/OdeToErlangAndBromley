import { useEffect, useState } from 'react';
import InputPanel from './components/InputPanel';
import ResultsDisplay from './components/ResultsDisplay';
import ChartsPanel from './components/ChartsPanel';
import CSVImport from './components/CSVImport';
import ACDImport from './components/ACDImport';
import SmartCSVImport from './components/SmartCSVImport';
import ExportPanel from './components/ExportPanel';
import MultiChannelPanel from './components/MultiChannelPanel';
import EducationalMode from './components/EducationalMode';
import ScenarioComparison from './components/ScenarioComparison';
import ModelComparison from './components/ModelComparison';
import ReverseCalculator from './components/ReverseCalculator';
import { useCalculatorStore } from './store/calculatorStore';

type Tab = 'calculator' | 'charts' | 'multichannel' | 'scenarios' | 'modelcomp' | 'capacity' | 'import' | 'export' | 'learn';

function App() {
  const calculate = useCalculatorStore((state) => state.calculate);
  const [activeTab, setActiveTab] = useState<Tab>('calculator');

  // Calculate on initial load
  useEffect(() => {
    calculate();
  }, [calculate]);

  const tabs = [
    { id: 'calculator' as Tab, name: 'Calculator', icon: '🧮' },
    { id: 'charts' as Tab, name: 'Charts & Analytics', icon: '📊' },
    { id: 'multichannel' as Tab, name: 'Multi-Channel', icon: '📞' },
    { id: 'scenarios' as Tab, name: 'What-If Scenarios', icon: '🔍' },
    { id: 'modelcomp' as Tab, name: 'Model Comparison', icon: '⚖️' },
    { id: 'capacity' as Tab, name: 'Capacity Planning', icon: '🎯' },
    { id: 'import' as Tab, name: 'Import Data', icon: '📥' },
    { id: 'export' as Tab, name: 'Export Results', icon: '📤' },
    { id: 'learn' as Tab, name: 'Learn', icon: '📚' }
  ];

  const handleDataImported = (data: any) => {
    console.log('Data imported:', data);
    // Here you could process the imported data and update the calculator store
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-primary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <div className="bg-primary-600 text-white p-3 rounded-xl shadow-lg">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    OdeToErlang
                  </h1>
                  <p className="text-sm text-gray-600">
                    Contact Center Capacity Planning Calculator
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span>100% Browser-Based</span>
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div>Erlang C • A • X • Multi-Channel</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200
                  ${activeTab === tab.id
                    ? 'border-b-2 border-primary-600 text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner - Only show on calculator tab */}
        {activeTab === 'calculator' && (
          <div className="mb-8 p-6 bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-xl shadow-lg">
            <div className="flex items-start space-x-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">Welcome to the Ultimate Contact Center Calculator!</h2>
                <p className="text-sm opacity-95">
                  Calculate staffing requirements using mathematically correct <strong>Erlang C, A, and X</strong> models
                  with <strong>multi-channel support</strong> and <strong>capacity planning</strong>.
                  Import data via CSV, compare models side-by-side, visualize with interactive charts, and export detailed reports.
                  Everything happens instantly in your browser - no data leaves your machine.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="animate-in fade-in duration-300">
          {activeTab === 'calculator' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <InputPanel />
              </div>
              <div>
                <ResultsDisplay />
              </div>
            </div>
          )}

          {activeTab === 'charts' && <ChartsPanel />}

          {activeTab === 'multichannel' && <MultiChannelPanel />}

          {activeTab === 'scenarios' && <ScenarioComparison />}

          {activeTab === 'modelcomp' && <ModelComparison />}

          {activeTab === 'capacity' && <ReverseCalculator />}

          {activeTab === 'import' && (
            <div className="space-y-8">
              <SmartCSVImport />
              <div className="border-t pt-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Legacy Importers</h3>
                <div className="space-y-8 opacity-75">
                  <ACDImport />
                  <CSVImport onDataImported={handleDataImported} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'export' && <ExportPanel />}

          {activeTab === 'learn' && <EducationalMode />}
        </div>

        {/* Feature Highlights - Show on calculator tab */}
        {activeTab === 'calculator' && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Interactive Charts</h3>
              <p className="text-sm text-gray-600">
                Visualize service level curves, cost trade-offs, occupancy trends, and intraday forecasts with beautiful charts.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Multi-Channel Support</h3>
              <p className="text-sm text-gray-600">
                Configure voice, chat, email, video, and custom channels. Model blended agents and see efficiency gains.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Educational Mode</h3>
              <p className="text-sm text-gray-600">
                Learn how Erlang C works with step-by-step breakdowns, formulas, and comprehensive explanations.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">About OdeToErlang</h4>
              <p className="text-gray-600 text-xs leading-relaxed">
                A comprehensive contact center capacity planning calculator.
                Named in tribute to A.K. Erlang and the mathematical foundations
                of queuing theory that power modern workforce management.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Features</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>✓ Erlang C, A, and X formulas</li>
                <li>✓ Model comparison (C vs A vs X)</li>
                <li>✓ Multi-channel with concurrency</li>
                <li>✓ Capacity planning (reverse calc)</li>
                <li>✓ Interactive charts & analytics</li>
                <li>✓ CSV import/export</li>
                <li>✓ What-if scenario analysis</li>
                <li>✓ Educational mode with formulas</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Resources</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>
                  <a href="https://github.com/elecumbelly/OdeToErlang" className="text-primary-600 hover:text-primary-700">
                    GitHub Repository
                  </a>
                </li>
                <li>
                  <a href="#" className="text-primary-600 hover:text-primary-700">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-primary-600 hover:text-primary-700">
                    API Reference
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              © 2025 SteS • MIT License • 100% Browser-Based • No Data Collection
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Built with React, TypeScript, Tailwind CSS, and Recharts
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
