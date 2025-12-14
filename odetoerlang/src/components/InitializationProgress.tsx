import { ProgressBar } from './ui/ProgressBar';

export type InitStage = 'idle' | 'loading-wasm' | 'loading-db' | 'seeding' | 'ready' | 'error';

interface InitializationProgressProps {
  stage: InitStage;
  progress: number;
  errorMessage?: string;
}

const stageMessages: Record<InitStage, string> = {
  idle: 'Preparing...',
  'loading-wasm': 'Loading database engine...',
  'loading-db': 'Initializing database...',
  seeding: 'Setting up sample data...',
  ready: 'Ready!',
  error: 'Initialization failed',
};

const stageTips: Record<InitStage, string> = {
  idle: 'Starting up...',
  'loading-wasm': 'Loading SQLite WebAssembly module (644 KB)',
  'loading-db': 'Checking for saved data...',
  seeding: 'Creating 51 staff, 7 campaigns, and sample data...',
  ready: 'All systems go!',
  error: 'Please try reloading the page',
};

export function InitializationProgress({
  stage,
  progress,
  errorMessage,
}: InitializationProgressProps) {
  const isError = stage === 'error';

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center">
      <div className="bg-bg-surface p-8 rounded-xl shadow-lg max-w-md w-full mx-4 border border-border-subtle">
        {/* Icon and Title */}
        <div className="text-center mb-6">
          {isError ? (
            <div className="text-red-500 text-6xl mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          ) : (
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan mx-auto mb-4" />
          )}
          <h2 className={`text-xl font-bold ${isError ? 'text-red' : 'text-text-primary'}`}>
            {stageMessages[stage]}
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            {isError && errorMessage ? errorMessage : stageTips[stage]}
          </p>
        </div>

        {/* Progress Bar */}
        {!isError && (
          <div className="mb-6">
            <ProgressBar
              value={progress}
              max={100}
              showLabel={true}
              label="Loading..."
              size="lg"
              variant="cyan"
            />
          </div>
        )}

        {/* Stage Indicators */}
        {!isError && (
          <div className="space-y-2">
            <StageIndicator
              label="Database Engine"
              isComplete={progress >= 33}
              isActive={stage === 'loading-wasm'}
            />
            <StageIndicator
              label="Initialize Storage"
              isComplete={progress >= 66}
              isActive={stage === 'loading-db'}
            />
            <StageIndicator
              label="Load Data"
              isComplete={progress >= 100}
              isActive={stage === 'seeding'}
            />
          </div>
        )}

        {/* Error Actions */}
        {isError && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-red/20 text-red px-6 py-2 rounded-lg hover:bg-red/30 transition-colors"
            >
              Reload Page
            </button>
          </div>
        )}

        {/* First-time tip */}
        {!isError && progress < 50 && (
          <div className="mt-6 p-3 bg-cyan/10 rounded-lg border border-cyan/20">
            <p className="text-xs text-cyan">
              <strong>First visit?</strong> Initial setup may take a few seconds while we prepare your workspace.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StageIndicator({
  label,
  isComplete,
  isActive,
}: {
  label: string;
  isComplete: boolean;
  isActive: boolean;
}) {
  return (
    <div className="flex items-center space-x-3">
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs
          ${isComplete ? 'bg-green text-text-primary' : isActive ? 'bg-cyan text-text-primary animate-pulse' : 'bg-bg-elevated text-text-muted'}`}
      >
        {isComplete ? '✓' : isActive ? '•' : '○'}
      </div>
      <span className={`text-sm ${isComplete ? 'text-green' : isActive ? 'text-cyan font-medium' : 'text-text-muted'}`}>
        {label}
      </span>
    </div>
  );
}
