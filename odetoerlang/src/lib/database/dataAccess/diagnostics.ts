/** Database diagnostics: row counts per allowlisted table. */
import { getDatabase } from './_shared';

/**
 * Allowlist of valid table names — prevents SQL injection if this function
 * is ever refactored to accept a runtime input.
 */
const ALLOWED_TABLES = [
  'Staff', 'Roles', 'Skills', 'StaffSkills', 'StaffSecondaryRoles', 'Sites',
  'Clients', 'Campaigns', 'Contracts', 'BillingRules',
  'Assumptions', 'CalendarEvents', 'ProductivityCurves', 'EventAssignments',
  'Scenarios', 'Forecasts', 'HistoricalData',
  'SupportingResources', 'AttritionCurves', 'RecruitmentPipeline', 'RecruitmentRequests',
] as const;

export function getTableCounts(): Record<string, number> {
  const db = getDatabase();

  const counts: Record<string, number> = {};
  ALLOWED_TABLES.forEach((table) => {
    try {
      const result = db.exec(`SELECT COUNT(*) FROM ${table}`);
      counts[table] = (result[0]?.values[0]?.[0] as number) ?? 0;
    } catch {
      counts[table] = 0;
    }
  });

  return counts;
}
