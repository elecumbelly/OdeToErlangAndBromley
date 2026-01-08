import { useEffect, useState, lazy, Suspense } from 'react';
import InputPanel from './components/InputPanel';
import ResultsDisplay from './components/ResultsDisplay';
import StaffingModelPanel from './components/StaffingModelPanel';
import type { InitStage } from './components/InitializationProgress';
import AssumptionsPanel from './components/AssumptionsPanel';
import ThemeToggle from './components/ui/ThemeToggle';
import MathModelSettings from './components/MathModelSettings';

// Lazy-loaded components for code splitting - reduces initial bundle size
const ChartsPanel = lazy(() => import('./components/ChartsPanel'));
const CSVImport = lazy(() => import('./components/CSVImport'));
const ACDImport = lazy(() => import('./components/ACDImport'));
const SmartCSVImport = lazy(() => import('./components/SmartCSVImport'));
const ExportPanel = lazy(() => import('./components/ExportPanel'));
const MultiChannelPanel = lazy(() => import('./components/MultiChannelPanel'));
const EducationalMode = lazy(() => import('./components/EducationalMode'));
const ScenarioComparison = lazy(() => import('./components/ScenarioComparison'));
const ModelComparison = lazy(() => import('./components/ModelComparison'));
const ReverseCalculator = lazy(() => import('./components/ReverseCalculator'));
const SimulationTab = lazy(() => import('./components/SimulationTab'));
const CalendarView = lazy(() => import('./components/Calendar/CalendarView'));
const HistoricalAnalysis = lazy(() => import('./components/HistoricalAnalysis'));
const WorkforceTab = lazy(() => import('./components/Workforce/WorkforceTab'));
const BPOTab = lazy(() => import('./components/BPO/BPOTab'));
const SchedulingTab = lazy(() => import('./components/SchedulingTab'));

import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useCalculatorStore } from './store/calculatorStore';

// Loading fallback for lazy-loaded components
function TabLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8 bg-bg-surface border border-border-subtle rounded-lg">
      <div className="flex items-center space-x-3 text-text-secondary">
        <svg className="animate-spin h-5 w-5 text-cyan" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-sm">LOADING MODULE...</span>
      </div>
    </div>
  );
}
import { useDatabaseStore } from './store/databaseStore';
import { initDatabase } from './lib/database/initDatabase';
import { seedDatabase, isDatabaseSeeded } from './lib/database/seedData';

type Tab = 'calculator' | 'charts' | 'multichannel' | 'scenarios' | 'modelcomp' | 'capacity' | 'assumptions' | 'historical' | 'calendar' | 'scheduling' | 'workforce' | 'bpo' | 'simulation' | 'import' | 'export' | 'learn';

function DbLoadingState({ stage, error }: { stage: InitStage; error: string | null }) {
  if (stage === 'error') {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-bg-surface border border-red/20 rounded-lg text-center">
        <div className="w-16 h-16 bg-red/10 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-red mb-2">Database Error</h3>
        <p className="text-sm text-text-secondary mb-6 max-w-md">
          {error || 'The database could not be initialized. Please check your browser console.'}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-bg-elevated hover:bg-bg-hover text-text-primary rounded transition-colors"
        >
          Reload Application
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-bg-surface border border-border-subtle rounded-lg">
      <div className="w-16 h-16 bg-cyan/10 rounded-full flex items-center justify-center mb-4 relative">
        <div className="absolute inset-0 rounded-full border-4 border-cyan/20 animate-ping"></div>
        <svg className="w-8 h-8 text-cyan animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">
        {stage === 'loading-wasm' && 'Loading Engine...'}
        {stage === 'loading-db' && 'Opening Database...'}
        {stage === 'seeding' && 'Creating Demo Data...'}
        {stage === 'idle' && 'Initializing...'}
      </h3>
      <p className="text-sm text-text-secondary">
        Setting up the secure browser-based database. This may take a moment.
      </p>
    </div>
  );
}

function App() {
  const calculate = useCalculatorStore((state) => state.calculate);
  const refreshAll = useDatabaseStore((state) => state.refreshAll);
  const [activeTab, setActiveTab] = useState<Tab>('calculator');
  const [initStage, setInitStage] = useState<InitStage>('idle');
  const [dbError, setDbError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(true);
  const [showTour, setShowTour] = useState<boolean>(false);
  const [tourStep, setTourStep] = useState<number>(0);

  const dbReady = initStage === 'ready';

  // Initialize database on app mount with progress tracking
  useEffect(() => {
    async function setupDatabase() {
      try {
        setInitStage('loading-wasm');
        await initDatabase();
        setInitStage('loading-db');
        if (!isDatabaseSeeded()) {
          setInitStage('seeding');
          await seedDatabase();
        }
        setInitStage('ready');
      } catch (error) {
        console.error('Database initialisation failed:', error);
        setInitStage('error');
        setDbError(error instanceof Error ? error.message : 'Unknown error');
      }
    }
    setupDatabase();
  }, []);

  // Calculate on initial load (after database is ready)
  useEffect(() => {
    if (dbReady) {
      calculate();
      refreshAll();
    }
  }, [dbReady, calculate, refreshAll]);

  // Onboarding banner persistence
  useEffect(() => {
    const stored = localStorage.getItem('ode_onboarding_dismissed');
    if (stored === 'true') {
      setShowOnboarding(false);
    }
    const tourSeen = localStorage.getItem('ode_tour_seen');
    if (tourSeen === 'true') {
      setShowTour(false);
    }
  }, []);

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('ode_onboarding_dismissed', 'true');
  };

  const startTour = () => {
    setShowTour(true);
    setTourStep(0);
  };

  const tourSteps = [
    {
      title: 'Import or Paste Data',
      body: 'Use the Import tab to paste or load CSV/Excel. Example data is available to try instantly.',
      action: () => setActiveTab('import'),
      cta: 'Open Import',
    },
    {
      title: 'Tune Inputs & Constraints',
      body: 'Adjust volume, AHT, occupancy cap, and staffing model. Results update automatically.',
      action: () => setActiveTab('calculator'),
      cta: 'Go to Calculator',
    },
    {
      title: 'Review & Export',
      body: 'Check “With Your Agents”, copy results for Excel, or export from the Export tab.',
      action: () => setActiveTab('export'),
      cta: 'Open Export',
    },
  ];

  const handleTourNext = () => {
    const next = tourStep + 1;
    if (next < tourSteps.length) {
      setTourStep(next);
      tourSteps[next].action();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setShowTour(false);
      localStorage.setItem('ode_tour_seen', 'true');
    }
  };

  const handleTourBack = () => {
    const prev = Math.max(0, tourStep - 1);
    setTourStep(prev);
    tourSteps[prev].action();
  };

  const skipTour = () => {
    setShowTour(false);
    localStorage.setItem('ode_tour_seen', 'true');
  };

  const tabs: { id: Tab; name: string; shortName?: string }[] = [
    { id: 'calculator', name: 'Calculator', shortName: 'CALC' },
    { id: 'charts', name: 'Analytics', shortName: 'CHARTS' },
    { id: 'multichannel', name: 'Multi-Channel', shortName: 'MULTI' },
    { id: 'scenarios', name: 'What-If', shortName: 'SCENAR' },
    { id: 'modelcomp', name: 'Compare', shortName: 'COMP' },
    { id: 'capacity', name: 'Capacity', shortName: 'CAP' },
    { id: 'assumptions', name: 'Assumptions', shortName: 'ASSUM' },
    { id: 'historical', name: 'Historical', shortName: 'HIST' },
    { id: 'calendar', name: 'Calendar', shortName: 'CAL' },
    { id: 'scheduling', name: 'Scheduling', shortName: 'SCHED' },
    { id: 'workforce', name: 'Workforce', shortName: 'STAFF' },
    { id: 'bpo', name: 'BPO', shortName: 'BPO' },
    { id: 'simulation', name: 'Simulate', shortName: 'SIM' },
    { id: 'import', name: 'Import', shortName: 'IN' },
    { id: 'export', name: 'Export', shortName: 'OUT' },
    { id: 'learn', name: 'Learn', shortName: 'EDU' }
  ];

  const setInput = useCalculatorStore((state) => state.setInput);

  const handleDataImported = (data: {
    volumes?: Array<{ volume?: number }>;
    aht?: Array<{ aht?: number; channel?: string }>;
    shrinkage?: Array<{ percentage?: number }>;
  }) => {
    if (data.volumes && data.volumes.length > 0) {
      const totalVolume = data.volumes.reduce((sum: number, row) => sum + (row.volume || 0), 0);
      const avgVolume = Math.round(totalVolume / data.volumes.length);
      setInput('volume', avgVolume > 0 ? avgVolume : 100);
    }
    if (data.aht && data.aht.length > 0) {
      const voiceAht = data.aht.find((row) => row.channel?.toLowerCase() === 'voice');
      const ahtValue = voiceAht?.aht || data.aht[0]?.aht || 240;
      setInput('aht', Math.round(ahtValue));
    }
    if (data.shrinkage && data.shrinkage.length > 0) {
      const totalShrinkage = data.shrinkage.reduce((sum: number, row) => sum + (row.percentage || 0), 0);
      setInput('shrinkagePercent', Math.min(totalShrinkage, 99));
    }
  };

  const showDbLoadingBanner = initStage !== 'ready' && initStage !== 'error';
  const showDbErrorBanner = initStage === 'error';

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Skip Link for Accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Database Status Bar */}
      {showDbLoadingBanner && (
        <div className="bg-bg-surface border-b border-border-muted px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-center space-x-2 text-sm text-cyan">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>INITIALIZING DATABASE...</span>
          </div>
        </div>
      )}
      {showDbErrorBanner && (
        <div className="bg-red/10 border-b border-red/30 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-center space-x-2 text-sm text-red">
            <span>DB ERROR: {dbError}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-bg-surface border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Logo Mark */}
              <div className="w-10 h-10 bg-bg-elevated border border-cyan/30 rounded-lg flex items-center justify-center shadow-glow-cyan">
                <span className="text-cyan font-bold text-lg">E</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary tracking-tight">
                  OdeToErlangAndBromley
                </h1>
                <p className="text-2xs text-text-muted uppercase tracking-widest">
                  Contact Centre Capacity Planning
                </p>
              </div>
            </div>
            {/* Status Indicators & Theme Toggle */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-6 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="status-dot status-dot-success"></span>
                  <span className="text-text-secondary">BROWSER-ONLY</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="status-dot status-dot-success"></span>
                  <span className="text-text-secondary">NO CLOUD / NO DATA LEAVES</span>
                </div>
                <div className="text-text-muted">|</div>
                <div className="text-text-secondary">
                  ERLANG B / C / A
                </div>
              </div>
              <MathModelSettings />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-bg-base border-b border-border-muted sticky top-0 z-10" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto py-2 scrollbar-thin" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                className={`
                  px-4 py-2 text-xs font-medium whitespace-nowrap transition-all duration-fast rounded-md
                  ${activeTab === tab.id
                    ? 'bg-cyan/10 text-cyan border border-cyan/30 shadow-glow-cyan'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover border border-transparent'
                  }
                `}
              >
                <span className="hidden sm:inline">{tab.name}</span>
                <span className="sm:hidden">{tab.shortName || tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Section - Calculator Tab Only */}
        {activeTab === 'calculator' && (
          <div className="space-y-4 mb-6">
            <div className="p-5 bg-gradient-to-r from-bg-surface to-bg-elevated border border-border-subtle/50 rounded-xl">
              <div className="flex items-start space-x-4">
                <div className="hidden sm:flex w-12 h-12 bg-cyan/10 border border-cyan/20 rounded-xl flex-shrink-0 items-center justify-center">
                  <svg className="w-6 h-6 text-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-text-primary mb-2">
                    Erlang Calculator
                  </h2>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Calculate staffing requirements using <span className="text-cyan font-medium">Erlang B</span>, <span className="text-green font-medium">C</span>, and <span className="text-magenta font-medium">A</span> models.
                    Multi-channel support, CSV import/export, interactive charts.
                  </p>
                </div>
              </div>
            </div>

            {showOnboarding && (
              <div className="p-4 bg-bg-surface border border-cyan/20 rounded-lg shadow-glow-cyan/40">
                <div className="flex items-start justify-between gap-3 flex-col sm:flex-row">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-cyan/10 border border-cyan/30 rounded-lg flex items-center justify-center">
                      <span className="text-cyan font-bold text-lg">1-2-3</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">Get started in 60 seconds</h3>
                      <ol className="text-2xs text-text-secondary space-y-1 mt-1 list-decimal list-inside">
                        <li>Paste or load example data → <button className="text-cyan hover:text-cyan-dim underline" onClick={() => setActiveTab('import')}>Import tab</button></li>
                        <li>Adjust volume/AHT and occupancy cap</li>
                        <li>Review “With Your Agents” and copy results to Excel</li>
                      </ol>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setActiveTab('import')}
                      className="px-3 py-2 bg-cyan text-bg-base rounded text-2xs font-semibold uppercase tracking-widest hover:bg-cyan/90 transition-colors"
                    >
                      Open Import
                    </button>
                    <button
                      onClick={() => setActiveTab('learn')}
                      className="px-3 py-2 bg-bg-elevated border border-border-muted rounded text-2xs font-semibold uppercase tracking-widest hover:bg-bg-hover transition-colors"
                    >
                      Learn Mode
                    </button>
                    <button
                      onClick={() => {
                        startTour();
                        setActiveTab('import');
                      }}
                      className="px-3 py-2 bg-bg-elevated border border-cyan/30 rounded text-2xs font-semibold uppercase tracking-widest hover:bg-cyan/10 transition-colors"
                    >
                      Start Tour
                    </button>
                    <button
                      onClick={dismissOnboarding}
                      className="text-2xs text-text-muted hover:text-text-secondary"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content */}
        <div className="animate-fade-in" role="tabpanel" id={`panel-${activeTab}`}>
          {activeTab === 'calculator' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <StaffingModelPanel />
              </div>
              <div>
                <InputPanel />
              </div>
              <div>
                <ResultsDisplay />
              </div>
            </div>
          )}

          {/* Lazy-loaded tabs */}
          <ErrorBoundary>
            <Suspense fallback={<TabLoadingFallback />}>
              {!dbReady && ['historical', 'calendar', 'scheduling', 'workforce', 'bpo', 'assumptions', 'import'].includes(activeTab) ? (
                <DbLoadingState stage={initStage} error={dbError} />
              ) : (
                <>
                  {activeTab === 'charts' && <ChartsPanel />}
                  {activeTab === 'multichannel' && <MultiChannelPanel />}
                  {activeTab === 'scenarios' && <ScenarioComparison />}
                  {activeTab === 'modelcomp' && <ModelComparison />}
                  {activeTab === 'capacity' && <ReverseCalculator />}
                  {activeTab === 'assumptions' && <AssumptionsPanel />}
                  {activeTab === 'historical' && <HistoricalAnalysis />}
                  {activeTab === 'calendar' && <CalendarView />}
                  {activeTab === 'scheduling' && <SchedulingTab />}
                  {activeTab === 'workforce' && <WorkforceTab />}
                  {activeTab === 'bpo' && <BPOTab />}
                  {activeTab === 'simulation' && <SimulationTab />}
                  {activeTab === 'import' && (
                    <div className="space-y-6">
                      <SmartCSVImport />
                      <div className="border-t border-border-subtle pt-6">
                        <h3 className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wide">Legacy Importers</h3>
                        <div className="space-y-6 opacity-60">
                          <ACDImport />
                          <CSVImport onDataImported={handleDataImported} />
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab === 'export' && <ExportPanel />}
                  {activeTab === 'learn' && <EducationalMode />}
                </>
              )}
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* Feature Cards - Calculator Tab Only */}
        {activeTab === 'calculator' && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-bg-surface border border-border-subtle rounded-lg p-4 hover:border-cyan/30 transition-colors">
              <div className="w-10 h-10 bg-cyan/10 border border-cyan/30 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-text-primary mb-1">Interactive Charts</h3>
              <p className="text-xs text-text-secondary">
                Visualize service levels, costs, occupancy trends, and intraday forecasts.
              </p>
            </div>

            <div className="bg-bg-surface border border-border-subtle rounded-lg p-4 hover:border-green/30 transition-colors">
              <div className="w-10 h-10 bg-green/10 border border-green/30 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-text-primary mb-1">Multi-Channel</h3>
              <p className="text-xs text-text-secondary">
                Voice, chat, email, video. Model blended agents and concurrency.
              </p>
            </div>

            <div className="bg-bg-surface border border-border-subtle rounded-lg p-4 hover:border-magenta/30 transition-colors">
              <div className="w-10 h-10 bg-magenta/10 border border-magenta/30 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-text-primary mb-1">Educational Mode</h3>
              <p className="text-xs text-text-secondary">
                Learn Erlang formulas with step-by-step breakdowns and explanations.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-border-muted">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div>
              <h4 className="font-semibold text-text-primary mb-2 uppercase tracking-wide text-2xs">About</h4>
              <p className="text-text-muted leading-relaxed">
                Comprehensive contact centre capacity planning calculator.
                Named in tribute to A.K. Erlang and the mathematical foundations
                of queuing theory.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-text-primary mb-2 uppercase tracking-wide text-2xs">Features</h4>
              <ul className="text-text-muted space-y-1">
                <li><span className="text-green">+</span> Erlang B, C, A formulas</li>
                <li><span className="text-green">+</span> Multi-channel with concurrency</li>
                <li><span className="text-green">+</span> CSV import/export</li>
                <li><span className="text-green">+</span> What-if scenarios</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-text-primary mb-2 uppercase tracking-wide text-2xs">Links</h4>
              <ul className="text-text-muted space-y-1">
                <li>
                  <a href="https://github.com/elecumbelly/OdeToErlangAndBromley" className="text-cyan hover:text-cyan-dim transition-colors">
                    GitHub Repository
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-border-muted text-center">
            <p className="text-2xs text-text-muted">
              2025 SteS / MIT License / 100% Browser-Based / No Data Collection
            </p>
          </div>
        </footer>
      </main>

      {/* Guided Tour Overlay */}
      {showTour && (
        <div className="fixed inset-0 z-40 bg-bg-base/80 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-bg-surface border border-border-subtle rounded-lg shadow-lg max-w-md w-full p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xs text-text-muted uppercase tracking-widest">Quick Tour</p>
                <h3 className="text-lg font-semibold text-text-primary">{tourSteps[tourStep].title}</h3>
              </div>
              <button
                onClick={skipTour}
                className="text-2xs text-text-muted hover:text-text-secondary"
              >
                Skip
              </button>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{tourSteps[tourStep].body}</p>
            <button
              onClick={tourSteps[tourStep].action}
              className="text-2xs font-semibold text-cyan uppercase tracking-widest underline"
            >
              {tourSteps[tourStep].cta}
            </button>
            <div className="flex items-center justify-between text-2xs text-text-muted">
              <span>Step {tourStep + 1} / {tourSteps.length}</span>
              <div className="space-x-2">
                <button
                  onClick={handleTourBack}
                  disabled={tourStep === 0}
                  className="px-3 py-1 border border-border-subtle rounded disabled:opacity-40"
                >
                  Back
                </button>
                <button
                  onClick={handleTourNext}
                  className="px-3 py-1 bg-cyan text-bg-base rounded"
                >
                  {tourStep === tourSteps.length - 1 ? 'Done' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
