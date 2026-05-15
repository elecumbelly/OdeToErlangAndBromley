/**
 * dataAccess — public barrel.
 *
 * The legacy single-file dataAccess.ts (1,777 LOC) was carved into focused
 * domain modules under ./dataAccess/. This barrel preserves the original
 * import surface: every consumer that did
 *
 *   import { getCampaigns } from '.../lib/database/dataAccess';
 *
 * continues to work unchanged.
 *
 * New code should consider importing directly from the relevant module
 * (e.g. './dataAccess/campaigns') to make the dependency explicit, but it
 * is not required.
 */

export type { PaginatedResult } from './dataAccess/_shared';

export * from './dataAccess/campaigns';
export * from './dataAccess/scenarios';
export * from './dataAccess/assumptions';
export * from './dataAccess/clients';
export * from './dataAccess/forecasts';
export * from './dataAccess/historical';
export * from './dataAccess/calendar';
export * from './dataAccess/scheduling';
export * from './dataAccess/staffing';
export * from './dataAccess/contracts';
export * from './dataAccess/recruitment';
export * from './dataAccess/diagnostics';
