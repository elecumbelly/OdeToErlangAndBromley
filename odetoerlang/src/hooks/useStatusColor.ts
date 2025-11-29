import { useMemo } from 'react';
import {
  getStatusForTarget,
  getStatusForLimit,
  getOccupancyStatus,
  getStatusTextClass,
  getStatusBgClass,
  type StatusLevel,
} from '../utils/colors';

interface StatusColorResult {
  status: StatusLevel;
  textClass: string;
  bgClass: string;
}

/**
 * Hook for computing status colors based on value vs target.
 * Higher values are better (e.g., service level).
 */
export function useStatusForTarget(
  value: number,
  target: number,
  thresholds?: { success: number; warning: number }
): StatusColorResult {
  return useMemo(() => {
    const status = getStatusForTarget(value, target, thresholds);
    return {
      status,
      textClass: getStatusTextClass(status),
      bgClass: getStatusBgClass(status),
    };
  }, [value, target, thresholds]);
}

/**
 * Hook for computing status colors where lower is better (e.g., ASA).
 */
export function useStatusForLimit(
  value: number,
  target: number,
  thresholds?: { success: number; warning: number }
): StatusColorResult {
  return useMemo(() => {
    const status = getStatusForLimit(value, target, thresholds);
    return {
      status,
      textClass: getStatusTextClass(status),
      bgClass: getStatusBgClass(status),
    };
  }, [value, target, thresholds]);
}

/**
 * Hook for computing occupancy status.
 */
export function useOccupancyStatus(occupancy: number): StatusColorResult {
  return useMemo(() => {
    const status = getOccupancyStatus(occupancy);
    return {
      status,
      textClass: getStatusTextClass(status),
      bgClass: getStatusBgClass(status),
    };
  }, [occupancy]);
}
