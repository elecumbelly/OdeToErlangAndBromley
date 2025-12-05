import React, { useState, useEffect } from 'react';
import { useDatabaseStore } from '../store/databaseStore';
import { useCalculatorStore } from '../store/calculatorStore';

const ScenarioManager: React.FC = () => {
  const {
    scenarios,
    selectedScenarioId,
    refreshScenarios,
    selectScenario,
    addScenario,
    removeScenario,
    makeBaseline,
    saveCurrentForecast,
    error,
  } = useDatabaseStore();

  const { inputs, results } = useCalculatorStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    refreshScenarios();
  }, [refreshScenarios]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const id = addScenario(newName.trim(), newDescription.trim() || undefined);
    if (id > 0) {
      selectScenario(id);
      setIsCreating(false);
      setNewName('');
      setNewDescription('');
    }
  };

  const handleSaveCalculation = () => {
    if (!selectedScenarioId || !results) return;

    const today = new Date().toISOString().split('T')[0];
    const forecastName = `${inputs.model} calculation - ${today}`;

    const id = saveCurrentForecast(
      forecastName,
      inputs.model,
      today,
      inputs.volume,
      inputs.aht,
      results.requiredAgents,
      results.totalFTE,
      results.serviceLevel / 100,
      results.occupancy / 100,
      results.asa
    );

    if (id) {
      setSaveMessage('Calculation saved!');
      setTimeout(() => setSaveMessage(null), 2000);
    }
  };

  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId);

  const inputClass = "mt-1 block w-full rounded-md bg-bg-surface border border-border-subtle text-text-primary text-sm px-3 py-2 focus:outline-none focus:border-cyan focus:ring-2 focus:ring-cyan/20 transition-all duration-fast";
  const labelClass = "block text-2xs font-semibold text-text-secondary uppercase tracking-widest";

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-lg p-4">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-border-muted">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Scenarios</h3>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-3 py-1 text-2xs font-medium rounded-md transition-all uppercase tracking-wide bg-cyan/10 text-cyan border border-cyan/30 hover:bg-cyan/20 hover:border-cyan/50"
        >
          {isCreating ? 'Cancel' : '+ New'}
        </button>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red/10 border border-red/30 rounded text-red text-xs">
          {error}
        </div>
      )}

      {saveMessage && (
        <div className="mb-3 p-2 bg-green/10 border border-green/30 rounded text-green text-xs">
          {saveMessage}
        </div>
      )}

      {isCreating && (
        <div className="mb-4 p-3 bg-bg-elevated border border-border-muted rounded-lg space-y-3">
          <div>
            <label htmlFor="scenarioName" className={labelClass}>Name</label>
            <input
              id="scenarioName"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className={inputClass}
              placeholder="e.g., Q1 Forecast"
            />
          </div>
          <div>
            <label htmlFor="scenarioDesc" className={labelClass}>Description (optional)</label>
            <input
              id="scenarioDesc"
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className={inputClass}
              placeholder="e.g., Conservative estimate"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="w-full px-3 py-2 text-2xs font-medium rounded-md transition-all uppercase tracking-wide bg-green/10 text-green border border-green/30 hover:bg-green/20 hover:border-green/50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create Scenario
          </button>
        </div>
      )}

      {/* Scenario List */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {scenarios.length === 0 ? (
          <p className="text-xs text-text-muted italic">No scenarios yet. Create one to save calculations.</p>
        ) : (
          scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className={`p-2 rounded-md border cursor-pointer transition-all ${
                selectedScenarioId === scenario.id
                  ? 'border-cyan/50 bg-cyan/5'
                  : 'border-border-muted hover:border-border-subtle hover:bg-bg-hover'
              }`}
              onClick={() => selectScenario(scenario.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium text-xs text-text-primary">{scenario.scenario_name}</span>
                  {scenario.is_baseline && (
                    <span className="ml-2 text-2xs bg-blue/10 text-blue border border-blue/30 px-1.5 py-0.5 rounded">
                      Baseline
                    </span>
                  )}
                  {scenario.description && (
                    <p className="text-2xs text-text-muted mt-0.5">{scenario.description}</p>
                  )}
                </div>
                {selectedScenarioId === scenario.id && (
                  <div className="flex gap-2">
                    {!scenario.is_baseline && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          makeBaseline(scenario.id);
                        }}
                        className="text-2xs text-blue hover:text-cyan transition-colors"
                        title="Set as baseline"
                      >
                        Set Baseline
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this scenario?')) {
                          removeScenario(scenario.id);
                        }
                      }}
                      className="text-2xs text-red hover:text-red/80 transition-colors"
                      title="Delete scenario"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Save Current Calculation */}
      {selectedScenarioId && results && (
        <div className="mt-4 pt-3 border-t border-border-muted">
          <button
            onClick={handleSaveCalculation}
            className="w-full px-3 py-2 text-2xs font-medium rounded-md transition-all uppercase tracking-wide bg-green/10 text-green border border-green/30 hover:bg-green/20 hover:border-green/50 hover:shadow-glow-green"
          >
            Save to "{selectedScenario?.scenario_name}"
          </button>
          <p className="text-2xs text-text-muted mt-1 text-center">
            {inputs.volume} vol, {results.requiredAgents} agents, {results.serviceLevel.toFixed(1)}% SL
          </p>
        </div>
      )}
    </div>
  );
};

export default ScenarioManager;
