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

  const inputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border";
  const labelClass = "block text-sm font-medium text-gray-700";
  const buttonClass = "px-3 py-1.5 text-sm font-medium rounded-md transition-colors";

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Scenarios</h3>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className={`${buttonClass} bg-primary-500 hover:bg-primary-600 text-white`}
        >
          {isCreating ? 'Cancel' : '+ New'}
        </button>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {saveMessage && (
        <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
          {saveMessage}
        </div>
      )}

      {isCreating && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md space-y-3">
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
            className={`${buttonClass} bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Create Scenario
          </button>
        </div>
      )}

      {/* Scenario List */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {scenarios.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No scenarios yet. Create one to save calculations.</p>
        ) : (
          scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className={`p-2 rounded-md border cursor-pointer transition-colors ${
                selectedScenarioId === scenario.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => selectScenario(scenario.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium text-sm">{scenario.scenario_name}</span>
                  {scenario.is_baseline && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                      Baseline
                    </span>
                  )}
                  {scenario.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{scenario.description}</p>
                  )}
                </div>
                {selectedScenarioId === scenario.id && (
                  <div className="flex gap-1">
                    {!scenario.is_baseline && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          makeBaseline(scenario.id);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800"
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
                      className="text-xs text-red-600 hover:text-red-800"
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
        <div className="mt-4 pt-3 border-t border-gray-200">
          <button
            onClick={handleSaveCalculation}
            className={`w-full ${buttonClass} bg-green-500 hover:bg-green-600 text-white`}
          >
            Save Current Calculation to "{selectedScenario?.scenario_name}"
          </button>
          <p className="text-xs text-gray-500 mt-1 text-center">
            Saves: {inputs.volume} vol, {results.requiredAgents} agents, {results.serviceLevel.toFixed(1)}% SL
          </p>
        </div>
      )}
    </div>
  );
};

export default ScenarioManager;
