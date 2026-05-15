/** Campaigns: lines of work an outsourcer or contact centre delivers. */
import {
  buildUpdateClause,
  execToArray,
  getDatabase,
  getLastInsertId,
  saveDatabase,
  stmtToObject,
} from './_shared';

export interface Campaign {
  id: number;
  campaign_name: string;
  client_id: number;
  channel_type: string;
  start_date: string;
  end_date: string | null;
  sla_target_percent: number;
  sla_threshold_seconds: number;
  concurrency_allowed: number;
  active: boolean;
  created_at: string;
}

export function getCampaigns(activeOnly: boolean = true): Campaign[] {
  const db = getDatabase();
  const sql = activeOnly
    ? 'SELECT * FROM Campaigns WHERE active = 1 ORDER BY campaign_name'
    : 'SELECT * FROM Campaigns ORDER BY campaign_name';
  return execToArray<Campaign>(db.exec(sql));
}

export function getCampaignById(id: number): Campaign | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM Campaigns WHERE id = ?');
  stmt.bind([id]);
  return stmtToObject<Campaign>(stmt);
}

export function createCampaign(campaign: Omit<Campaign, 'id' | 'created_at'>): number {
  const db = getDatabase();
  db.run(
    `INSERT INTO Campaigns (campaign_name, client_id, channel_type, start_date, end_date,
     sla_target_percent, sla_threshold_seconds, concurrency_allowed, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      campaign.campaign_name,
      campaign.client_id,
      campaign.channel_type,
      campaign.start_date,
      campaign.end_date,
      campaign.sla_target_percent,
      campaign.sla_threshold_seconds,
      campaign.concurrency_allowed,
      campaign.active ? 1 : 0,
    ]
  );

  const id = getLastInsertId();
  saveDatabase();
  return id;
}

export function updateCampaign(id: number, updates: Partial<Campaign>): void {
  const clause = buildUpdateClause(updates);
  if (!clause) return;

  const db = getDatabase();
  db.run(`UPDATE Campaigns SET ${clause.setClause} WHERE id = ?`, [...clause.values, id]);
  saveDatabase();
}
