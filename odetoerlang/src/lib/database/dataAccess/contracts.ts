/** BPO management: sites, client contracts, billing rules. */
import type { SqlValue } from 'sql.js';
import {
  buildUpdateClause,
  execToArray,
  getDatabase,
  getLastInsertId,
  getScalar,
  saveDatabase,
  stmtToArray,
  stmtToObject,
} from './_shared';
import type { PaginatedResult } from './_shared';

export interface Site {
  id: number;
  site_name: string;
  location: string | null;
  building_capacity: number | null;
  desk_count: number | null;
  timezone: string | null;
  created_at: string;
}

export interface Contract {
  id: number;
  client_id: number;
  contract_number: string;
  start_date: string;
  end_date: string | null;
  currency: string;
  auto_renew: boolean;
  notice_period_days: number;
  created_at: string;
}

export interface BillingRule {
  id: number;
  contract_id: number;
  campaign_id: number | null;
  /** 'PerSeat', 'PerFTE', 'PerHour', etc. */
  billing_model: string;
  rate: number;
  penalty_per_sla_point: number;
  reward_per_sla_point: number;
  valid_from: string;
  valid_to: string | null;
  created_at: string;
}

// --- SITES ---

export function getSites(): Site[] {
  const db = getDatabase();
  return execToArray<Site>(db.exec('SELECT * FROM Sites ORDER BY site_name'));
}

export function createSite(site: Omit<Site, 'id' | 'created_at'>): number {
  const db = getDatabase();
  db.run(
    `INSERT INTO Sites (site_name, location, building_capacity, desk_count, timezone)
     VALUES (?, ?, ?, ?, ?)`,
    [site.site_name, site.location, site.building_capacity, site.desk_count, site.timezone]
  );
  const id = getLastInsertId();
  saveDatabase();
  return id;
}

export function updateSite(id: number, updates: Partial<Site>): void {
  const clause = buildUpdateClause(updates);
  if (!clause) return;

  const db = getDatabase();
  db.run(`UPDATE Sites SET ${clause.setClause} WHERE id = ?`, [...clause.values, id]);
  saveDatabase();
}

export function deleteSite(id: number): void {
  const db = getDatabase();
  db.run('DELETE FROM Sites WHERE id = ?', [id]);
  saveDatabase();
}

// --- CONTRACTS ---

export function getContracts(
  clientId: number | null = null,
  limit: number = 50,
  offset: number = 0
): PaginatedResult<Contract> {
  const db = getDatabase();
  const whereClause = clientId ? ' WHERE client_id = ?' : '';
  const whereParams: SqlValue[] = clientId ? [clientId] : [];

  const total = getScalar<number>(
    `SELECT COUNT(*) FROM Contracts${whereClause}`,
    whereParams,
    0
  );

  const stmt = db.prepare(
    `SELECT * FROM Contracts${whereClause} ORDER BY start_date DESC LIMIT ? OFFSET ?`
  );
  stmt.bind([...whereParams, limit, offset]);
  const data = stmtToArray<Contract>(stmt);

  return { data, total };
}

export function getContractById(id: number): Contract | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM Contracts WHERE id = ?');
  stmt.bind([id]);
  return stmtToObject<Contract>(stmt);
}

export function createContract(contract: Omit<Contract, 'id' | 'created_at'>): number {
  const db = getDatabase();
  db.run(
    `INSERT INTO Contracts (
      client_id, contract_number, start_date, end_date, currency, auto_renew, notice_period_days
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      contract.client_id,
      contract.contract_number,
      contract.start_date,
      contract.end_date,
      contract.currency,
      contract.auto_renew ? 1 : 0,
      contract.notice_period_days,
    ]
  );
  const id = getLastInsertId();
  saveDatabase();
  return id;
}

export function updateContract(id: number, updates: Partial<Contract>): void {
  const clause = buildUpdateClause(updates, { boolFields: ['auto_renew'] });
  if (!clause) return;

  const db = getDatabase();
  db.run(`UPDATE Contracts SET ${clause.setClause} WHERE id = ?`, [...clause.values, id]);
  saveDatabase();
}

export function deleteContract(id: number): void {
  const db = getDatabase();
  db.run('DELETE FROM BillingRules WHERE contract_id = ?', [id]);
  db.run('DELETE FROM Contracts WHERE id = ?', [id]);
  saveDatabase();
}

// --- BILLING RULES ---

export function getBillingRules(contractId: number, campaignId: number | null = null): BillingRule[] {
  const db = getDatabase();
  let sql = 'SELECT * FROM BillingRules WHERE contract_id = ?';
  const params: SqlValue[] = [contractId];

  if (campaignId !== null) {
    sql += ' AND (campaign_id = ? OR campaign_id IS NULL)';
    params.push(campaignId);
  } else {
    sql += ' ORDER BY valid_from DESC';
  }

  const stmt = db.prepare(sql);
  stmt.bind(params);
  return stmtToArray<BillingRule>(stmt);
}

export function getBillingRuleById(id: number): BillingRule | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM BillingRules WHERE id = ?');
  stmt.bind([id]);
  return stmtToObject<BillingRule>(stmt);
}

export function createBillingRule(rule: Omit<BillingRule, 'id' | 'created_at'>): number {
  const db = getDatabase();
  db.run(
    `INSERT INTO BillingRules (
      contract_id, campaign_id, billing_model, rate, penalty_per_sla_point,
      reward_per_sla_point, valid_from, valid_to
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      rule.contract_id,
      rule.campaign_id,
      rule.billing_model,
      rule.rate,
      rule.penalty_per_sla_point,
      rule.reward_per_sla_point,
      rule.valid_from,
      rule.valid_to,
    ]
  );
  const id = getLastInsertId();
  saveDatabase();
  return id;
}

export function updateBillingRule(id: number, updates: Partial<BillingRule>): void {
  const clause = buildUpdateClause(updates);
  if (!clause) return;

  const db = getDatabase();
  db.run(`UPDATE BillingRules SET ${clause.setClause} WHERE id = ?`, [...clause.values, id]);
  saveDatabase();
}

export function deleteBillingRule(id: number): void {
  const db = getDatabase();
  db.run('DELETE FROM BillingRules WHERE id = ?', [id]);
  saveDatabase();
}
