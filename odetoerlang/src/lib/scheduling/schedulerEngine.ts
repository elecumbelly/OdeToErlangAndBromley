import {
  getScheduleRunById,
  getSchedulePlanById,
  getCoverageRequirements,
  getShiftTemplates,
  getOptimizationMethods,
  getAllStaff,
  getStaffSkills,
  clearScheduleRunData,
  createShift,
  createShiftSegments,
  saveScheduleMetrics,
  saveScheduleViolations,
  updateScheduleRunStatus,
  type CoverageRequirement,
  type ScheduleMetric,
  type ScheduleViolation,
  type Staff,
} from '../database/dataAccess';

const DEFAULT_SHIFT_START_MIN = 9 * 60;
const HOURLY_RATE = 25;
const MS_PER_HOUR = 1000 * 60 * 60;

type IntervalDefinition = {
  key: string;
  start: number;
  end: number;
  duration: number;
};

type RequirementBucket = {
  intervals: IntervalDefinition[];
  intervalLookup: Map<string, IntervalDefinition>;
  requirements: Map<string, Map<number, number>>;
};

type Assignment = {
  staffId: number;
  date: string;
  primarySkillId: number;
  skills: number[];
  shiftStartMin: number;
  shiftEndMin: number;
};

const padTime = (value: number) => String(value).padStart(2, '0');

const formatMinutes = (minutes: number) => {
  const safe = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  return `${padTime(hours)}:${padTime(mins)}:00`;
};

const parseTimeToMinutes = (time: string) => {
  const [hourPart, minutePart] = time.split(':');
  const hours = Number(hourPart);
  const minutes = Number(minutePart ?? '0');
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return hours * 60 + minutes;
};

const ensureMap = <K, V>(map: Map<K, V>, key: K, factory: () => V): V => {
  const existing = map.get(key);
  if (existing) return existing;
  const created = factory();
  map.set(key, created);
  return created;
};

const getWeekKey = (dateStr: string) => {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  const day = date.getDay();
  const diff = (day + 6) % 7;
  date.setDate(date.getDate() - diff);
  return date.toISOString().split('T')[0];
};

const buildRequirementBuckets = (requirements: CoverageRequirement[]) => {
  const buckets = new Map<string, RequirementBucket>();
  const requiredAgentsByDateSkill = new Map<string, Map<number, number>>();
  const skillIds = new Set<number>();

  requirements.forEach((req) => {
    const bucket = ensureMap(buckets, req.requirement_date, () => ({
      intervals: [],
      intervalLookup: new Map<string, IntervalDefinition>(),
      requirements: new Map<string, Map<number, number>>(),
    }));

    const intervalKey = `${req.interval_start}-${req.interval_end}`;
    let interval = bucket.intervalLookup.get(intervalKey);
    if (!interval) {
      const start = parseTimeToMinutes(req.interval_start);
      const end = parseTimeToMinutes(req.interval_end);
      interval = { key: intervalKey, start, end, duration: Math.max(0, end - start) };
      bucket.intervalLookup.set(intervalKey, interval);
      bucket.intervals.push(interval);
    }

    const intervalSkills = ensureMap(bucket.requirements, intervalKey, () => new Map<number, number>());
    intervalSkills.set(req.skill_id, req.required_agents);

    const skillTotals = ensureMap(requiredAgentsByDateSkill, req.requirement_date, () => new Map<number, number>());
    const currentMax = skillTotals.get(req.skill_id) ?? 0;
    if (req.required_agents > currentMax) {
      skillTotals.set(req.skill_id, req.required_agents);
    }
    skillIds.add(req.skill_id);
  });

  buckets.forEach((bucket) => {
    bucket.intervals.sort((a, b) => a.start - b.start);
  });

  return { buckets, requiredAgentsByDateSkill, skillIds };
};

const parseTemplateId = (notes: string | null) => {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes);
    if (parsed && typeof parsed.template_id === 'number') {
      return parsed.template_id as number;
    }
    return null;
  } catch {
    return null;
  }
};

const scheduleLunch = (
  shiftStart: number,
  shiftEnd: number,
  duration: number,
  lunchWindowStartMin: number,
  lunchWindowEndMin: number
) => {
  if (duration <= 0) return null;
  const windowStart = shiftStart + Math.max(0, lunchWindowStartMin);
  const windowEnd = shiftStart + Math.max(0, lunchWindowEndMin) - duration;
  let lunchStart = shiftStart + Math.round((shiftEnd - shiftStart - duration) / 2);
  if (windowEnd >= windowStart) {
    lunchStart = windowStart + Math.round((windowEnd - windowStart) / 2);
  }
  lunchStart = Math.max(shiftStart, Math.min(lunchStart, shiftEnd - duration));
  return { start: lunchStart, end: lunchStart + duration };
};

const scheduleBreaks = (
  shiftStart: number,
  shiftEnd: number,
  breakCount: number,
  breakMinutes: number,
  breakWindowStartMin: number,
  breakWindowEndMin: number,
  lunchSegment: { start: number; end: number } | null
) => {
  const breakStarts: number[] = [];
  if (breakCount <= 0 || breakMinutes <= 0) return breakStarts;

  const windowStart = shiftStart + Math.max(0, breakWindowStartMin);
  const windowEnd = shiftStart + Math.max(0, breakWindowEndMin) - breakMinutes;
  const safeStart = windowEnd >= windowStart ? windowStart : shiftStart;
  const safeEnd = windowEnd >= windowStart ? windowEnd : shiftEnd - breakMinutes;
  const span = Math.max(0, safeEnd - safeStart);

  for (let i = 0; i < breakCount; i += 1) {
    let start = safeStart + Math.round(((i + 1) / (breakCount + 1)) * span);
    if (lunchSegment && start < lunchSegment.end && start + breakMinutes > lunchSegment.start) {
      const beforeLunch = lunchSegment.start - breakMinutes;
      const afterLunch = lunchSegment.end;
      if (beforeLunch >= safeStart) {
        start = beforeLunch;
      } else if (afterLunch <= safeEnd) {
        start = afterLunch;
      }
    }
    start = Math.max(shiftStart, Math.min(start, shiftEnd - breakMinutes));
    breakStarts.push(start);
  }

  return breakStarts.sort((a, b) => a - b);
};

const buildWorkBlocks = (
  shiftStart: number,
  shiftEnd: number,
  offSegments: Array<{ start: number; end: number }>
) => {
  const blocks: Array<{ start: number; end: number }> = [];
  const sortedOff = offSegments.sort((a, b) => a.start - b.start);
  let cursor = shiftStart;
  sortedOff.forEach((segment) => {
    if (cursor < segment.start) {
      blocks.push({ start: cursor, end: segment.start });
    }
    cursor = Math.max(cursor, segment.end);
  });
  if (cursor < shiftEnd) {
    blocks.push({ start: cursor, end: shiftEnd });
  }
  return blocks;
};

const addCoverageMinutes = (
  coverage: Map<string, Map<string, Map<number, number>>>,
  date: string,
  intervalKey: string,
  skillId: number,
  minutes: number
) => {
  const dateMap = ensureMap(coverage, date, () => new Map<string, Map<number, number>>());
  const intervalMap = ensureMap(dateMap, intervalKey, () => new Map<number, number>());
  intervalMap.set(skillId, (intervalMap.get(skillId) ?? 0) + minutes);
};

const addCoverageForSegment = (
  coverage: Map<string, Map<string, Map<number, number>>>,
  bucket: RequirementBucket,
  date: string,
  segmentStart: number,
  segmentEnd: number,
  skillId: number
) => {
  bucket.intervals.forEach((interval) => {
    const overlapStart = Math.max(segmentStart, interval.start);
    const overlapEnd = Math.min(segmentEnd, interval.end);
    if (overlapEnd > overlapStart) {
      addCoverageMinutes(coverage, date, interval.key, skillId, overlapEnd - overlapStart);
    }
  });
};

const pickSkillForInterval = (
  skills: number[],
  intervalRemaining: Map<number, number> | undefined,
  fallbackSkill: number
) => {
  let bestSkill = skills.includes(fallbackSkill) ? fallbackSkill : skills[0];
  let bestRemaining = -1;
  if (intervalRemaining) {
    skills.forEach((skillId) => {
      const remaining = intervalRemaining.get(skillId) ?? 0;
      if (remaining > bestRemaining) {
        bestRemaining = remaining;
        bestSkill = skillId;
      }
    });
  }
  return bestSkill;
};

export interface ScheduleRunSummary {
  runId: number;
  shifts: number;
  segments: number;
  metrics: ScheduleMetric;
  violations: number;
}

export function runScheduleOptimization(scheduleRunId: number): ScheduleRunSummary {
  const run = getScheduleRunById(scheduleRunId);
  if (!run) {
    throw new Error('Schedule run not found.');
  }

  const plan = getSchedulePlanById(run.schedule_plan_id);
  if (!plan) {
    throw new Error('Schedule plan not found.');
  }

  const requirements = getCoverageRequirements(plan.id);
  if (requirements.length === 0) {
    const metrics: ScheduleMetric = {
      schedule_run_id: scheduleRunId,
      coverage_percent: 0,
      gap_minutes: 0,
      overstaff_minutes: 0,
      overtime_minutes: 0,
      violations_count: 1,
      cost_estimate: 0,
      created_at: new Date().toISOString(),
    };
    saveScheduleMetrics(metrics);
    saveScheduleViolations([{
      schedule_run_id: scheduleRunId,
      staff_id: null,
      violation_date: plan.start_date,
      violation_type: 'Coverage',
      details: 'No coverage requirements found.',
    }]);
    updateScheduleRunStatus(scheduleRunId, 'Failed', null, new Date().toISOString());
    return { runId: scheduleRunId, shifts: 0, segments: 0, metrics, violations: 1 };
  }

  const templateId = parseTemplateId(run.notes ?? null);
  const templates = getShiftTemplates();
  const template = templates.find((item) => item.id === templateId) ?? templates[0];
  if (!template) {
    throw new Error('Shift template not found.');
  }

  const methodLookup = new Map(getOptimizationMethods().map((method) => [method.id, method.method_key]));
  const methodKey = methodLookup.get(run.method_id) ?? 'greedy';
  const respectConstraints = methodKey !== 'greedy';
  const allowSkillSwitch = Boolean(plan.allow_skill_switch);

  const { buckets, requiredAgentsByDateSkill, skillIds } = buildRequirementBuckets(requirements);
  const allStaff = getAllStaff(true);
  const staffSkills = getStaffSkills();

  const staffSkillMap = new Map<number, number[]>();
  staffSkills.forEach((entry) => {
    if (!skillIds.has(entry.skill_id)) return;
    const skills = ensureMap(staffSkillMap, entry.staff_id, () => []);
    skills.push(entry.skill_id);
  });

  const staffPool: Array<Staff & { skills: number[] }> = allStaff
    .map((staff) => ({ ...staff, skills: staffSkillMap.get(staff.id) ?? [] }))
    .filter((staff) => staff.skills.length > 0);

  const assignments: Assignment[] = [];
  const assignedByDate = new Map<string, Set<number>>();
  const weeklyMinutes = new Map<number, Map<string, number>>();
  const lastShiftEnd = new Map<number, number>();
  const violations: Array<Omit<ScheduleViolation, 'id' | 'created_at'>> = [];

  const totalShiftMinutes = template.paid_minutes + template.unpaid_minutes;
  const maxWeeklyMinutes = plan.max_weekly_hours * 60;
  const minRestHours = plan.min_rest_hours;

  const sortedDates = Array.from(requiredAgentsByDateSkill.keys()).sort();

  sortedDates.forEach((date) => {
    const bucket = buckets.get(date);
    if (!bucket) return;

    const skillNeeds = requiredAgentsByDateSkill.get(date);
    if (!skillNeeds) return;

    const assignedStaff = ensureMap(assignedByDate, date, () => new Set<number>());
    const shiftStartMin = bucket.intervals[0]?.start ?? DEFAULT_SHIFT_START_MIN;
    const shiftEndMin = shiftStartMin + totalShiftMinutes;
    const shiftStartTime = formatMinutes(shiftStartMin);
    const shiftEndTime = formatMinutes(shiftEndMin);
    const shiftStartMs = new Date(`${date}T${shiftStartTime}`).getTime();
    const shiftEndMs = new Date(`${date}T${shiftEndTime}`).getTime();

    const skillOrder = Array.from(skillNeeds.entries()).sort((a, b) => b[1] - a[1]);

    skillOrder.forEach(([skillId, needed]) => {
      if (needed <= 0) return;
      const candidates = staffPool
        .filter((staff) => staff.skills.includes(skillId) && !assignedStaff.has(staff.id))
        .sort((a, b) => {
          if (allowSkillSwitch) {
            return b.skills.length - a.skills.length;
          }
          return a.skills.length - b.skills.length;
        });

      let remaining = needed;
      for (const staff of candidates) {
        if (remaining <= 0) break;

        const weekKey = getWeekKey(date);
        const staffWeeks = ensureMap(weeklyMinutes, staff.id, () => new Map<string, number>());
        const currentWeekly = staffWeeks.get(weekKey) ?? 0;
        const projectedWeekly = currentWeekly + template.paid_minutes;
        const lastEnd = lastShiftEnd.get(staff.id);
        const restGapHours = lastEnd ? (shiftStartMs - lastEnd) / MS_PER_HOUR : null;
        const restViolation = restGapHours !== null && restGapHours < minRestHours;
        const weeklyViolation = projectedWeekly > maxWeeklyMinutes;

        if (respectConstraints && (restViolation || weeklyViolation)) {
          continue;
        }

        if (!respectConstraints) {
          if (restViolation) {
            violations.push({
              schedule_run_id: scheduleRunId,
              staff_id: staff.id,
              violation_date: date,
              violation_type: 'Rest',
              details: `Rest gap ${restGapHours?.toFixed(1)}h`,
            });
          }
          if (weeklyViolation) {
            violations.push({
              schedule_run_id: scheduleRunId,
              staff_id: staff.id,
              violation_date: date,
              violation_type: 'WeeklyHours',
              details: `Projected ${Math.round(projectedWeekly / 60)}h exceeds limit`,
            });
          }
        }

        assignments.push({
          staffId: staff.id,
          date,
          primarySkillId: skillId,
          skills: staff.skills,
          shiftStartMin,
          shiftEndMin,
        });

        assignedStaff.add(staff.id);
        staffWeeks.set(weekKey, projectedWeekly);
        lastShiftEnd.set(staff.id, shiftEndMs);
        remaining -= 1;
      }
    });
  });

  const startedAt = new Date().toISOString();
  updateScheduleRunStatus(scheduleRunId, 'Running', startedAt, null);
  clearScheduleRunData(scheduleRunId);

  try {
    const remainingMinutes = new Map<string, Map<string, Map<number, number>>>();
    buckets.forEach((bucket, date) => {
      const intervalMap = ensureMap(remainingMinutes, date, () => new Map<string, Map<number, number>>());
      bucket.requirements.forEach((skillsMap, intervalKey) => {
        const interval = bucket.intervalLookup.get(intervalKey);
        const duration = interval?.duration ?? plan.interval_minutes;
        const remainingBySkill = ensureMap(intervalMap, intervalKey, () => new Map<number, number>());
        skillsMap.forEach((requiredAgents, skillId) => {
          remainingBySkill.set(skillId, requiredAgents * duration);
        });
      });
    });

    const coverageMinutes = new Map<string, Map<string, Map<number, number>>>();
    let shiftCount = 0;
    let segmentCount = 0;

    assignments.forEach((assignment) => {
      const bucket = buckets.get(assignment.date);
      if (!bucket) return;

      const shiftId = createShift({
        schedule_run_id: scheduleRunId,
        staff_id: assignment.staffId,
        shift_date: assignment.date,
        start_time: formatMinutes(assignment.shiftStartMin),
        end_time: formatMinutes(assignment.shiftEndMin),
        template_id: template.id,
      });
      shiftCount += 1;

      const lunchSegment = scheduleLunch(
        assignment.shiftStartMin,
        assignment.shiftEndMin,
        template.unpaid_minutes,
        plan.lunch_window_start_min,
        plan.lunch_window_end_min
      );

      const breakStarts = scheduleBreaks(
        assignment.shiftStartMin,
        assignment.shiftEndMin,
        template.break_count,
        template.break_minutes,
        plan.break_window_start_min,
        plan.break_window_end_min,
        lunchSegment
      );

      const breakSegments = breakStarts.map((start) => ({
        start,
        end: start + template.break_minutes,
      }));

      const offSegments = [...breakSegments];
      if (lunchSegment) {
        offSegments.push(lunchSegment);
      }

      const workBlocks = buildWorkBlocks(assignment.shiftStartMin, assignment.shiftEndMin, offSegments);
      const segments: Array<{
        shift_id: number;
        segment_start: string;
        segment_end: string;
        segment_type: string;
        skill_id: number | null;
        is_paid: boolean;
      }> = [];

      breakSegments.forEach((segment) => {
        segments.push({
          shift_id: shiftId,
          segment_start: formatMinutes(segment.start),
          segment_end: formatMinutes(segment.end),
          segment_type: 'break',
          skill_id: null,
          is_paid: true,
        });
      });

      if (lunchSegment) {
        segments.push({
          shift_id: shiftId,
          segment_start: formatMinutes(lunchSegment.start),
          segment_end: formatMinutes(lunchSegment.end),
          segment_type: 'lunch',
          skill_id: null,
          is_paid: false,
        });
      }

      workBlocks.forEach((block) => {
        if (allowSkillSwitch) {
          bucket.intervals.forEach((interval) => {
            const overlapStart = Math.max(block.start, interval.start);
            const overlapEnd = Math.min(block.end, interval.end);
            if (overlapEnd <= overlapStart) return;
            const intervalRemaining = remainingMinutes.get(assignment.date)?.get(interval.key);
            const skillId = pickSkillForInterval(
              assignment.skills,
              intervalRemaining,
              assignment.primarySkillId
            );
            const overlapMinutes = overlapEnd - overlapStart;
            if (!skillId) return;
            segments.push({
              shift_id: shiftId,
              segment_start: formatMinutes(overlapStart),
              segment_end: formatMinutes(overlapEnd),
              segment_type: 'work',
              skill_id: skillId,
              is_paid: true,
            });
            if (intervalRemaining) {
              intervalRemaining.set(skillId, (intervalRemaining.get(skillId) ?? 0) - overlapMinutes);
            }
            addCoverageMinutes(coverageMinutes, assignment.date, interval.key, skillId, overlapMinutes);
          });
        } else {
          segments.push({
            shift_id: shiftId,
            segment_start: formatMinutes(block.start),
            segment_end: formatMinutes(block.end),
            segment_type: 'work',
            skill_id: assignment.primarySkillId,
            is_paid: true,
          });
          addCoverageForSegment(
            coverageMinutes,
            bucket,
            assignment.date,
            block.start,
            block.end,
            assignment.primarySkillId
          );
        }
      });

      createShiftSegments(segments);
      segmentCount += segments.length;
    });

    let totalRequiredMinutes = 0;
    let gapMinutes = 0;
    let overstaffMinutes = 0;

    buckets.forEach((bucket, date) => {
      bucket.requirements.forEach((skillsMap, intervalKey) => {
        const interval = bucket.intervalLookup.get(intervalKey);
        const intervalMinutes = interval?.duration ?? plan.interval_minutes;
        skillsMap.forEach((requiredAgents, skillId) => {
          const requiredMinutes = requiredAgents * intervalMinutes;
          totalRequiredMinutes += requiredMinutes;
          const coveredMinutes = coverageMinutes.get(date)?.get(intervalKey)?.get(skillId) ?? 0;
          if (coveredMinutes < requiredMinutes) {
            gapMinutes += requiredMinutes - coveredMinutes;
          } else if (coveredMinutes > requiredMinutes) {
            overstaffMinutes += coveredMinutes - requiredMinutes;
          }
        });
      });
    });

    let overtimeMinutes = 0;
    weeklyMinutes.forEach((weeks) => {
      weeks.forEach((minutes) => {
        if (minutes > maxWeeklyMinutes) {
          overtimeMinutes += minutes - maxWeeklyMinutes;
        }
      });
    });

    if (gapMinutes > 0) {
      violations.push({
        schedule_run_id: scheduleRunId,
        staff_id: null,
        violation_date: plan.start_date,
        violation_type: 'Coverage',
        details: 'Coverage gap detected.',
      });
    }

    const coveragePercent = totalRequiredMinutes > 0
      ? ((totalRequiredMinutes - gapMinutes) / totalRequiredMinutes) * 100
      : 0;

    const paidMinutes = shiftCount * template.paid_minutes;
    const metrics: ScheduleMetric = {
      schedule_run_id: scheduleRunId,
      coverage_percent: Number(coveragePercent.toFixed(2)),
      gap_minutes: Math.round(gapMinutes),
      overstaff_minutes: Math.round(overstaffMinutes),
      overtime_minutes: Math.round(overtimeMinutes),
      violations_count: violations.length,
      cost_estimate: Number(((paidMinutes / 60) * HOURLY_RATE).toFixed(2)),
      created_at: new Date().toISOString(),
    };

    saveScheduleMetrics(metrics);
    if (violations.length > 0) {
      saveScheduleViolations(violations);
    }

    updateScheduleRunStatus(scheduleRunId, 'Completed', null, new Date().toISOString());

    return {
      runId: scheduleRunId,
      shifts: shiftCount,
      segments: segmentCount,
      metrics,
      violations: violations.length,
    };
  } catch (error) {
    updateScheduleRunStatus(scheduleRunId, 'Failed', null, new Date().toISOString());
    throw error;
  }
}
