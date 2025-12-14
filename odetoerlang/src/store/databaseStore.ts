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
  getAllAssumptions,
  upsertAssumption,
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getTableCounts,
  type Campaign,
  type Scenario,
  type Client,
  type Assumption,
  type CalendarEvent,
} from '../lib/database/dataAccess';

interface DatabaseState {
  // Data
  campaigns: Campaign[];
  scenarios: Scenario[];
  clients: Client[];
  assumptions: Assumption[]; // All assumptions
  campaignAssumptions: Assumption[]; // Assumptions filtered by selected campaign
  calendarEvents: CalendarEvent[];

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
  fetchAssumptions: () => void; // Fetch all assumptions
  refreshCampaignAssumptions: () => void; // Fetch assumptions for current campaign
  fetchCalendarEvents: (start: string, end: string) => void;
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

  // Actions - Calendar
  addCalendarEvent: (event: Omit<CalendarEvent, 'id' | 'created_at'>) => number;
  editCalendarEvent: (id: number, updates: Partial<CalendarEvent>) => void;
  removeCalendarEvent: (id: number) => void;

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
  currentAssumptions: [], // Initial state
  campaigns: [],
  scenarios: [],
  clients: [],
  assumptions: [], // Initial state for all assumptions
  campaignAssumptions: [], // Initial state for campaign-specific assumptions
  calendarEvents: [],
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
      console.error('Failed to load campaigns:', err);
      set({ error: 'Failed to load campaigns.' });
    }
  },

  refreshScenarios: () => {
    try {
      const scenarios = getScenarios();
      set({ scenarios, error: null });
    } catch (err) {
      console.error('Failed to load scenarios:', err);
      set({ error: 'Failed to load scenarios.' });
    }
  },

  refreshClients: () => {
    try {
      const result = getClients(false, 1000, 0); // Fetch up to 1000 clients for legacy support
      set({ clients: result.data, error: null });
    } catch (err) {
      console.error('Failed to load clients:', err);
      set({ error: 'Failed to load clients.' });
    }
  },

  fetchAssumptions: () => {
    try {
      const allAssumptions = getAllAssumptions(); // Fetches ALL assumptions
      set({ assumptions: allAssumptions, error: null });
    } catch (err) {
      console.error('Failed to load all assumptions:', err);
      set({ error: 'Failed to load assumptions.' });
    }
  },

  refreshCampaignAssumptions: () => {
    const { selectedCampaignId } = get();
    try {
      const campaignAssumptions = getCurrentAssumptions(selectedCampaignId);
      set({ campaignAssumptions, error: null });
    } catch (err) {
      console.error('Failed to load campaign assumptions:', err);
      set({ error: 'Failed to load campaign assumptions.' });
    }
  },

  fetchCalendarEvents: (start, end) => {
    const { selectedCampaignId } = get();
    try {
      const events = getCalendarEvents(start, end, selectedCampaignId);
      set({ calendarEvents: events, error: null });
    } catch (err) {
      console.error('Failed to load calendar events:', err);
      set({ error: 'Failed to load calendar events.' });
    }
  },

  refreshAll: () => {
    set({ isLoading: true });
    get().refreshCampaigns();
    get().refreshScenarios();
    get().refreshClients();
    get().fetchAssumptions(); // Fetch all assumptions
    get().refreshCampaignAssumptions(); // Fetch campaign-specific assumptions
    set({ isLoading: false });
  },

  // Selection
  selectCampaign: (id) => {
    set({ selectedCampaignId: id });
    get().refreshCampaignAssumptions(); // Refresh campaign-specific assumptions
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
      console.error('Failed to create campaign:', err);
      set({ error: 'Failed to create campaign.' });
      return -1;
    }
  },

  editCampaign: (id, updates) => {
    try {
      updateCampaign(id, updates);
      get().refreshCampaigns();
    } catch (err) {
      console.error('Failed to update campaign:', err);
      set({ error: 'Failed to update campaign.' });
    }
  },

  // Scenarios
  addScenario: (name, description, isBaseline = false) => {
    try {
      const id = createScenario(name, description, isBaseline);
      get().refreshScenarios();
      return id;
    } catch (err) {
      console.error('Failed to create scenario:', err);
      set({ error: 'Failed to create scenario.' });
      return -1;
    }
  },

  editScenario: (id, updates) => {
    try {
      updateScenario(id, updates);
      get().refreshScenarios();
    } catch (err) {
      console.error('Failed to update scenario:', err);
      set({ error: 'Failed to update scenario.' });
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
      console.error('Failed to delete scenario:', err);
      set({ error: 'Failed to delete scenario.' });
    }
  },

  makeBaseline: (id) => {
    try {
      setBaselineScenario(id);
      get().refreshScenarios();
    } catch (err) {
      console.error('Failed to set baseline:', err);
      set({ error: 'Failed to set baseline.' });
    }
  },

  // Clients
  addClient: (name, industry) => {
    try {
      const id = createClient(name, industry);
      get().refreshClients();
      return id;
    } catch (err) {
      console.error('Failed to create client:', err);
      set({ error: 'Failed to create client.' });
      return -1;
    }
  },

  // Calendar
  addCalendarEvent: (event) => {
    try {
      const id = createCalendarEvent(event);
      return id;
    } catch (err) {
      console.error('Failed to create event:', err);
      set({ error: 'Failed to create event.' });
      return -1;
    }
  },

  editCalendarEvent: (id, updates) => {
    try {
      updateCalendarEvent(id, updates);
    } catch (err) {
      console.error('Failed to update event:', err);
      set({ error: 'Failed to update event.' });
    }
  },

  removeCalendarEvent: (id) => {
    try {
      deleteCalendarEvent(id);
    } catch (err) {
      console.error('Failed to delete event:', err);
      set({ error: 'Failed to delete event.' });
    }
  },

  // Assumptions
  saveAssumption: (type, value, unit, validFrom, campaignId = null, validTo = null) => {
    try {
      const id = upsertAssumption(type, value, unit, validFrom, campaignId, validTo);
      get().fetchAssumptions(); // Refresh ALL assumptions
      return id;
    } catch (err) {
      console.error('Failed to save assumption:', err);
      set({ error: 'Failed to save assumption.' });
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
      console.error('Failed to save forecast:', err);
      set({ error: 'Failed to save forecast.' });
      return null;
    }
  },

  // Diagnostics
  getTableStats: () => {
    try {
      return getTableCounts();
    } catch (err) {
      console.error('Failed to get table stats:', err); // Sanitize this too
      return {};
    }
  },
}));