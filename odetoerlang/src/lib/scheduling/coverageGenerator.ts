import { CalculationService } from '../services/CalculationService';
import { normalizeModel } from '../calculations/erlangEngine';
import type { CalculationInputs, ErlangVariant } from '../../types';
import {
  getSchedulePlanById,
  getCampaignById,
  getScenarioById,
  getForecastsByScenarioAndDateRange,
  getSkills,
  replaceCoverageRequirements,
  type CoverageRequirement,
  type Forecast,
  type Skill,
} from '../database/dataAccess';

const DEFAULT_SHIFT_START_MIN = 9 * 60;
const DEFAULT_SHIFT_DURATION_MIN = 9 * 60;

const DEFAULT_SHIFT_TYPES = [
  { hours: 8, enabled: true, proportion: 100 },
];

const DEFAULT_STAFFING_MODEL = {
  totalHeadcount: 0,
  operatingHoursPerDay: 0,
  daysOpenPerWeek: 5,
  shiftTypes: DEFAULT_SHIFT_TYPES,
  useAsConstraint: false,
};

export interface CoverageGenerationResult {
  requirements: number;
  dates: number;
  intervalsPerDay: number;
  skills: number;
}

const padTime = (value: number) => String(value).padStart(2, '0');

const formatMinutes = (minutes: number) => {
  const safe = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  return `${padTime(hours)}:${padTime(mins)}:00`;
};

const enumerateDates = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return dates;

  for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
    dates.push(current.toISOString().split('T')[0]);
  }

  return dates;
};

const buildIntervalPattern = (intervals: number): number[] => {
  if (intervals <= 0) return [];
  const weights: number[] = [];
  for (let i = 0; i < intervals; i += 1) {
    const t = intervals === 1 ? 0.5 : i / (intervals - 1);
    const morning = Math.exp(-Math.pow((t - 0.3) / 0.18, 2));
    const afternoon = Math.exp(-Math.pow((t - 0.7) / 0.18, 2));
    const weight = 0.25 + 0.55 * morning + 0.45 * afternoon;
    weights.push(weight);
  }
  const total = weights.reduce((sum, value) => sum + value, 0);
  return total > 0 ? weights.map((value) => value / total) : weights.map(() => 1 / intervals);
};

const selectSkills = (campaignType: string | null, skills: Skill[]) => {
  if (!campaignType) return skills;
  const matching = skills.filter((skill) => (skill.skill_type || '').toLowerCase() === campaignType.toLowerCase());
  return matching.length > 0 ? matching : skills;
};

const selectForecastByDate = (forecasts: Forecast[]) => {
  const lookup = new Map<string, Forecast>();
  forecasts.forEach((forecast) => {
    const existing = lookup.get(forecast.forecast_date);
    if (!existing || forecast.id > existing.id) {
      lookup.set(forecast.forecast_date, forecast);
    }
  });
  return lookup;
};

const resolveModel = (scenarioModel: string | null, baseModel: CalculationInputs['model']): ErlangVariant => {
  if (scenarioModel && (scenarioModel === 'A' || scenarioModel === 'B' || scenarioModel === 'C')) {
    return scenarioModel;
  }
  return normalizeModel(baseModel);
};

export function generateCoverageRequirements(
  schedulePlanId: number,
  baseInputs: CalculationInputs
): CoverageGenerationResult {
  const plan = getSchedulePlanById(schedulePlanId);
  if (!plan) {
    throw new Error('Schedule plan not found.');
  }

  const campaign = getCampaignById(plan.campaign_id);
  if (!campaign) {
    throw new Error('Campaign not found.');
  }

  const scenario = plan.scenario_id ? getScenarioById(plan.scenario_id) : null;
  const intervalMinutes = Math.max(1, plan.interval_minutes || baseInputs.intervalMinutes);
  const totalMinutes = DEFAULT_SHIFT_DURATION_MIN;
  const intervalsPerDay = Math.max(1, Math.floor(totalMinutes / intervalMinutes));
  const intervalPattern = buildIntervalPattern(intervalsPerDay);

  const allSkills = getSkills();
  const planSkills = selectSkills(campaign.channel_type, allSkills);
  if (planSkills.length === 0) {
    throw new Error('No skills found for coverage generation.');
  }

  const dates = enumerateDates(plan.start_date, plan.end_date);
  const forecasts = plan.scenario_id
    ? getForecastsByScenarioAndDateRange(plan.scenario_id, plan.campaign_id, plan.start_date, plan.end_date)
    : [];
  const forecastLookup = selectForecastByDate(forecasts);
  const model = resolveModel(scenario?.erlang_model ?? null, baseInputs.model);

  const requirements: Array<Omit<CoverageRequirement, 'id' | 'created_at'>> = [];

  dates.forEach((date) => {
    const forecast = forecastLookup.get(date);
    const dailyVolume = forecast?.forecasted_volume ?? baseInputs.volume * intervalsPerDay;
    const aht = forecast?.forecasted_aht ?? baseInputs.aht;
    const sourceForecastId = forecast?.id ?? null;

    for (let i = 0; i < intervalsPerDay; i += 1) {
      const intervalStartMin = DEFAULT_SHIFT_START_MIN + i * intervalMinutes;
      const intervalEndMin = intervalStartMin + intervalMinutes;
      const intervalVolume = dailyVolume * intervalPattern[i];
      const volumePerSkill = planSkills.length > 0 ? intervalVolume / planSkills.length : 0;

      planSkills.forEach((skill) => {
        const inputs: CalculationInputs = {
          ...baseInputs,
          volume: volumePerSkill,
          aht,
          intervalMinutes,
          model,
        };

        const result = CalculationService.calculate(inputs, DEFAULT_STAFFING_MODEL);
        let requiredAgents = 0;
        if (result.results) {
          const fte = result.results.totalFTE ?? 0;
          requiredAgents = fte > 0 ? Math.max(1, Math.ceil(fte)) : 0;
        }

        requirements.push({
          schedule_plan_id: plan.id,
          requirement_date: date,
          interval_start: formatMinutes(intervalStartMin),
          interval_end: formatMinutes(intervalEndMin),
          skill_id: skill.id,
          required_agents: requiredAgents,
          source_forecast_id: sourceForecastId,
        });
      });
    }
  });

  replaceCoverageRequirements(schedulePlanId, requirements);

  return {
    requirements: requirements.length,
    dates: dates.length,
    intervalsPerDay,
    skills: planSkills.length,
  };
}
