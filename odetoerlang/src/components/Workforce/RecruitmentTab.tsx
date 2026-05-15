import { useState } from 'react';
import PipelineManager from './Recruitment/PipelineManager';
import RequestsManager from './Recruitment/RequestsManager';

type ActiveView = 'pipeline' | 'requests';

export default function RecruitmentTab() {
  const [activeView, setActiveView] = useState<ActiveView>('pipeline');

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b border-border-subtle">
        <button
          onClick={() => setActiveView('pipeline')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeView === 'pipeline'
              ? 'border-cyan text-cyan'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-active'
          }`}
        >
          Pipeline Stages
        </button>
        <button
          onClick={() => setActiveView('requests')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeView === 'requests'
              ? 'border-cyan text-cyan'
              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-active'
          }`}
        >
          Hiring Requests
        </button>
      </div>

      <div className="animate-fade-in">
        {activeView === 'pipeline' ? <PipelineManager /> : <RequestsManager />}
      </div>
    </div>
  );
}
