/** Clients: the buyer of a contact-centre's service (paginated). */
import {
  execToArray,
  getDatabase,
  getLastInsertId,
  saveDatabase,
} from './_shared';
import type { PaginatedResult } from './_shared';

export interface Client {
  id: number;
  client_name: string;
  industry: string | null;
  active: boolean;
  created_at: string;
}

export function getClients(
  activeOnly: boolean = true,
  limit: number = 50,
  offset: number = 0
): PaginatedResult<Client> {
  const db = getDatabase();
  const whereClause = activeOnly ? ' WHERE active = 1' : '';

  const countResult = db.exec(`SELECT COUNT(*) as count FROM Clients${whereClause}`);
  const total = (countResult[0]?.values[0]?.[0] as number) ?? 0;

  const data = execToArray<Client>(
    db.exec(`SELECT * FROM Clients${whereClause} ORDER BY client_name LIMIT ${limit} OFFSET ${offset}`)
  );

  return { data, total };
}

export function createClient(name: string, industry?: string): number {
  const db = getDatabase();
  db.run(
    `INSERT INTO Clients (client_name, industry, active) VALUES (?, ?, 1)`,
    [name, industry ?? null]
  );

  const id = getLastInsertId();
  saveDatabase();
  return id;
}
