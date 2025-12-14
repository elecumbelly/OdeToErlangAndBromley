import { getCurrentAssumptions, type Campaign } from '../database/dataAccess';

/**
 * Interface for normalized inputs to the ErlangMathEngine.
 * This object is derived from time-bound assumptions for a specific date.
 */
export interface ErlangMathInputs {
  volume: number;              // Raw call volume for the interval
  aht: number;                 // Average Handle Time in seconds
  intervalMinutes: number;     // Length of the interval in minutes (e.g., 30)
  targetSLPercent: number;     // Target Service Level percentage (e.g., 80 for 80%)
  thresholdSeconds: number;    // Service Level threshold in seconds (e.g., 20 for 80/20)
  shrinkagePercent: number;    // Shrinkage percentage (e.g., 25 for 25%)
  maxOccupancy: number;        // Maximum Occupancy percentage (e.g., 90 for 90%)
  averagePatience: number;     // Average customer patience in seconds (for Erlang A/X)
  concurrency?: number;        // Concurrency allowed for multi-channel (e.g., chat)
}

/**
 * Resolves all relevant assumptions for a given campaign and date.
 * This acts as the bridge between time-bound database assumptions and the
 * concrete inputs needed for the Erlang calculation engine.
 *
 * @param campaignId The ID of the campaign to resolve assumptions for. Pass null for global assumptions.
 * @param asOfDate The date for which to resolve assumptions (YYYY-MM-DD format).
 * @param defaultCampaign A default campaign object (e.g., from database) to fall back on for some values.
 * @returns An ErlangMathInputs object.
 */
export function resolveAssumptionsForDate(
  campaignId: number | null,
  asOfDate: string,
  defaultCampaign: Campaign // Can pass a campaign object for default SLA/concurrency
): ErlangMathInputs {
  const assumptions = getCurrentAssumptions(campaignId, asOfDate);

  // Initialize with reasonable defaults or values from a default campaign object
  // These are typical defaults if no assumption is found or campaign provides them.
  const resolvedInputs: ErlangMathInputs = {
    volume: 0, // Volume will typically come from a forecast, not an assumption
    aht: 240, // 4 minutes
    intervalMinutes: 30,
    targetSLPercent: defaultCampaign.sla_target_percent ?? 80,
    thresholdSeconds: defaultCampaign.sla_threshold_seconds ?? 20,
    shrinkagePercent: 25,
    maxOccupancy: 90,
    averagePatience: 120, // 2 minutes
    concurrency: defaultCampaign.concurrency_allowed ?? 1,
  };

  // Apply assumptions, overriding defaults
  assumptions.forEach(assumption => {
    switch (assumption.assumption_type) {
      case 'AHT':
        resolvedInputs.aht = assumption.value;
        break;
      case 'Shrinkage':
        resolvedInputs.shrinkagePercent = assumption.value;
        break;
      case 'Occupancy':
        resolvedInputs.maxOccupancy = assumption.value;
        break;
      case 'SLA':
        // Assuming 'SLA' assumption type can set both percent and threshold
        // Or we might need separate assumption types like 'SL_PERCENT' and 'SL_THRESHOLD'
        // For now, let's assume 'SLA' assumption type primarily affects targetSLPercent
        resolvedInputs.targetSLPercent = assumption.value;
        break;
      case 'AveragePatience':
        resolvedInputs.averagePatience = assumption.value;
        break;
      // Note: Volume, Interval, ThresholdSeconds need separate assumption types or derivation
      // ThresholdSeconds could be tied to SLA assumption or be a separate 'SLA_THRESHOLD' type
      // For this resolver, we are focused on calculation parameters.
    }
  });

  // Special handling for SLA threshold - it's often paired with SLA percent.
  // If we have a specific 'SLA_THRESHOLD' assumption type, it would be processed above.
  // Otherwise, defaultCampaign.sla_threshold_seconds is the best source.

  return resolvedInputs;
}
