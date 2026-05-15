import { getCoverageRequirements } from '../../lib/database/dataAccess';
import { toLocalDateString } from '../../lib/dateUtils';

export type PlanFormState = {
  planName: string;
  startDate: string;
  endDate: string;
  intervalMinutes: number;
  maxWeeklyHours: number;
  minRestHours: number;
  allowSkillSwitch: boolean;
  breakWindowStartMin: number;
  breakWindowEndMin: number;
  lunchWindowStartMin: number;
  lunchWindowEndMin: number;
  status: string;
};

export type CoverageSummary = {
  total: number;
  dates: number;
  intervals: number;
  skills: number;
};

export const dateToInput = (date: Date) => toLocalDateString(date);

export const createDefaultPlanState = (): PlanFormState => {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setMonth(endDate.getMonth() + 3);

  return {
    planName: '',
    startDate: dateToInput(today),
    endDate: dateToInput(endDate),
    intervalMinutes: 30,
    maxWeeklyHours: 40,
    minRestHours: 11,
    allowSkillSwitch: true,
    breakWindowStartMin: 60,
    breakWindowEndMin: 480,
    lunchWindowStartMin: 180,
    lunchWindowEndMin: 360,
    status: 'Draft',
  };
};

export const formatMinutes = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

export const statusVariant = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === 'completed') return 'success';
  if (normalized === 'failed' || normalized === 'error') return 'error';
  if (normalized === 'running' || normalized === 'queued' || normalized === 'pending') return 'warning';
  return 'neutral';
};

export const summarizeCoverageRequirements = (
  requirements: ReturnType<typeof getCoverageRequirements>
): CoverageSummary => {
  const dates = new Set(requirements.map((req) => req.requirement_date));
  const intervals = new Set(requirements.map((req) => `${req.requirement_date}-${req.interval_start}`));
  const skills = new Set(requirements.map((req) => req.skill_id));
  return {
    total: requirements.length,
    dates: dates.size,
    intervals: intervals.size,
    skills: skills.size,
  };
};

export const compareMetric = (
  label: string,
  valueA?: number,
  valueB?: number,
  suffix: string = ''
) => {
  if (valueA === undefined || valueB === undefined) {
    return { label, valueA: '---', valueB: '---', delta: '---' };
  }
  const delta = valueB - valueA;
  return {
    label,
    valueA: `${valueA}${suffix}`,
    valueB: `${valueB}${suffix}`,
    delta: `${delta >= 0 ? '+' : ''}${delta}${suffix}`,
  };
};
