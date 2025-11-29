import { create } from 'zustand';
import {
  getCampaigns,
  getScenarios,
  getClients,
  createCampaign,
  createScenario,
  createClient,
  updateCampaign,
  updateScenario,
  deleteScenario,
  setBaselineScenario,
  saveForecast,
  getCurrentAssumptions,
  upsertAssumption,
  getTableCounts,
  type Campaign,
  type Scenario,
  type Client,
  type Assumption,
} from '../lib/database/dataAccess';

interface DatabaseState {
  // Data
  campaigns: Campaign[];
  scenarios: Scenario[];
  clients: Client[];
  currentAssumptions: Assumption[];

  // Selection state
  selectedCampaignId: number | null;
  selectedScenarioId: number | null;

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Actions - Data fetching
  refreshCampaigns: () => void;
  refreshScenarios: () => void;
  refreshClients: () => void;
  refreshCurrentAssumptions: () => void;
  refreshAll: () => void;

  // Actions - Selection
  selectCampaign: (id: number | null) => void;
  selectScenario: (id: number | null) => void;

  // Actions - Campaigns
  addCampaign: (campaign: Omit<Campaign, 'id' | 'created_at'>) => number;
  editCampaign: (id: number, updates: Partial<Campaign>) => void;

  // Actions - Scenarios
  addScenario: (name: string, description?: string, isBaseline?: boolean) => number;
  editScenario: (id: number, updates: Partial<Scenario>) => void;
  removeScenario: (id: number) => void;
  makeBaseline: (id: number) => void;

  // Actions - Clients
  addClient: (name: string, industry?: string) => number;

  // Actions - Assumptions
  saveAssumption: (
    type: string,
    value: number,
    unit: string,
    validFrom: string,
    campaignId?: number | null,
    validTo?: string | null
  ) => number;

  // Actions - Forecasts
  saveCurrentForecast: (
    forecastName: string,
    modelType: string,
    date: string,
    volume: number,
    aht: number | null,
    agents: number | null,
    fte: number | null,
    sla: number | null,
    occupancy: number | null,
    asa: number | null
  ) => number | null;

  // Diagnostics
  getTableStats: () => Record<string, number>;
}

export const useDatabaseStore = create<DatabaseState>((set, get) => ({
  // Initial state
  campaigns: [],
  scenarios: [],
  clients: [],
  currentAssumptions: [],
  selectedCampaignId: null,
  selectedScenarioId: null,
  isLoading: false,
  error: null,

  // Data fetching
  refreshCampaigns: () => {
    try {
      const campaigns = getCampaigns(false); // Include inactive
      set({ campaigns, error: null });
    } catch (err) {
      set({ error: `Failed to load campaigns: ${err}` });
    }
  },

  refreshScenarios: () => {
    try {
      const scenarios = getScenarios();
      set({ scenarios, error: null });
    } catch (err) {
      set({ error: `Failed to load scenarios: ${err}` });
    }
  },

  refreshClients: () => {
    try {
      const clients = getClients(false);
      set({ clients, error: null });
    } catch (err) {
      set({ error: `Failed to load clients: ${err}` });
    }
  },

  refreshCurrentAssumptions: () => {
    const { selectedCampaignId } = get();
    try {
      const assumptions = getCurrentAssumptions(selectedCampaignId);
      set({ currentAssumptions: assumptions, error: null });
    } catch (err) {
      set({ error: `Failed to load assumptions: ${err}` });
    }
  },

  refreshAll: () => {
    set({ isLoading: true });
    get().refreshCampaigns();
    get().refreshScenarios();
    get().refreshClients();
    get().refreshCurrentAssumptions();
    set({ isLoading: false });
  },

  // Selection
  selectCampaign: (id) => {
    set({ selectedCampaignId: id });
    get().refreshCurrentAssumptions();
  },

  selectScenario: (id) => {
    set({ selectedScenarioId: id });
  },

  // Campaigns
  addCampaign: (campaign) => {
    try {
      const id = createCampaign(campaign);
      get().refreshCampaigns();
      return id;
    } catch (err) {
      set({ error: `Failed to create campaign: ${err}` });
      return -1;
    }
  },

  editCampaign: (id, updates) => {
    try {
      updateCampaign(id, updates);
      get().refreshCampaigns();
    } catch (err) {
      set({ error: `Failed to update campaign: ${err}` });
    }
  },

  // Scenarios
  addScenario: (name, description, isBaseline = false) => {
    try {
      const id = createScenario(name, description, isBaseline);
      get().refreshScenarios();
      return id;
    } catch (err) {
      set({ error: `Failed to create scenario: ${err}` });
      return -1;
    }
  },

  editScenario: (id, updates) => {
    try {
      updateScenario(id, updates);
      get().refreshScenarios();
    } catch (err) {
      set({ error: `Failed to update scenario: ${err}` });
    }
  },

  removeScenario: (id) => {
    try {
      deleteScenario(id);
      const { selectedScenarioId } = get();
      if (selectedScenarioId === id) {
        set({ selectedScenarioId: null });
      }
      get().refreshScenarios();
    } catch (err) {
      set({ error: `Failed to delete scenario: ${err}` });
    }
  },

  makeBaseline: (id) => {
    try {
      setBaselineScenario(id);
      get().refreshScenarios();
    } catch (err) {
      set({ error: `Failed to set baseline: ${err}` });
    }
  },

  // Clients
  addClient: (name, industry) => {
    try {
      const id = createClient(name, industry);
      get().refreshClients();
      return id;
    } catch (err) {
      set({ error: `Failed to create client: ${err}` });
      return -1;
    }
  },

  // Assumptions
  saveAssumption: (type, value, unit, validFrom, campaignId = null, validTo = null) => {
    try {
      const id = upsertAssumption(type, value, unit, validFrom, campaignId, validTo);
      get().refreshCurrentAssumptions();
      return id;
    } catch (err) {
      set({ error: `Failed to save assumption: ${err}` });
      return -1;
    }
  },

  // Forecasts
  saveCurrentForecast: (forecastName, modelType, date, volume, aht, agents, fte, sla, occupancy, asa) => {
    const { selectedScenarioId, selectedCampaignId } = get();

    if (!selectedScenarioId) {
      set({ error: 'No scenario selected. Create or select a scenario first.' });
      return null;
    }

    // Use campaign 1 as default if none selected (for quick calculations)
    const campaignId = selectedCampaignId ?? 1;

    try {
      const id = saveForecast({
        forecast_name: forecastName,
        scenario_id: selectedScenarioId,
        model_type: modelType,
        campaign_id: campaignId,
        forecast_date: date,
        forecasted_volume: volume,
        forecasted_aht: aht,
        required_agents: agents,
        required_fte: fte,
        expected_sla: sla,
        expected_occupancy: occupancy,
        expected_asa: asa,
      });
      return id;
    } catch (err) {
      set({ error: `Failed to save forecast: ${err}` });
      return null;
    }
  },

  // Diagnostics
  getTableStats: () => {
    try {
      return getTableCounts();
    } catch {
      return {};
    }
  },
}));
