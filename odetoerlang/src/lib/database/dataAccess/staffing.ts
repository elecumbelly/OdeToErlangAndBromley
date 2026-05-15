/** Workforce: roles, skills, staff (paginated + all-rows variants). */
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

export interface Role {
  id: number;
  role_name: string;
  /** 'Agent', 'TeamLeader', 'QA', etc. */
  role_type: string;
  reports_to_role_id: number | null;
  created_at: string;
}

export interface Skill {
  id: number;
  skill_name: string;
  skill_type: string | null;
  description: string | null;
  created_at: string;
}

export interface Staff {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  primary_role_id: number;
  employment_type: string;
  manager_id: number | null;
  start_date: string;
  end_date: string | null;
  site_id: number | null;
  attrition_probability: number;
  created_at: string;
  updated_at: string;
}

// --- ROLES ---

export function getRoles(): Role[] {
  const db = getDatabase();
  return execToArray<Role>(db.exec('SELECT * FROM Roles ORDER BY role_name'));
}

export function createRole(role: Omit<Role, 'id' | 'created_at'>): number {
  const db = getDatabase();
  db.run(
    `INSERT INTO Roles (role_name, role_type, reports_to_role_id) VALUES (?, ?, ?)`,
    [role.role_name, role.role_type, role.reports_to_role_id]
  );
  const id = getLastInsertId();
  saveDatabase();
  return id;
}

export function updateRole(id: number, updates: Partial<Role>): void {
  const clause = buildUpdateClause(updates);
  if (!clause) return;

  const db = getDatabase();
  db.run(`UPDATE Roles SET ${clause.setClause} WHERE id = ?`, [...clause.values, id]);
  saveDatabase();
}

export function deleteRole(id: number): void {
  const db = getDatabase();
  db.run('DELETE FROM Roles WHERE id = ?', [id]);
  saveDatabase();
}

// --- SKILLS ---

export function getSkills(): Skill[] {
  const db = getDatabase();
  return execToArray<Skill>(db.exec('SELECT * FROM Skills ORDER BY skill_name'));
}

export function createSkill(skill: Omit<Skill, 'id' | 'created_at'>): number {
  const db = getDatabase();
  db.run(
    `INSERT INTO Skills (skill_name, skill_type, description) VALUES (?, ?, ?)`,
    [skill.skill_name, skill.skill_type, skill.description]
  );
  const id = getLastInsertId();
  saveDatabase();
  return id;
}

export function deleteSkill(id: number): void {
  const db = getDatabase();
  db.run('DELETE FROM Skills WHERE id = ?', [id]);
  saveDatabase();
}

// --- STAFF ---

export function getStaff(
  activeOnly: boolean = true,
  limit: number = 50,
  offset: number = 0
): PaginatedResult<Staff> {
  const db = getDatabase();
  const whereClause = activeOnly ? ' WHERE end_date IS NULL' : '';

  const total = getScalar<number>(`SELECT COUNT(*) FROM Staff${whereClause}`, [], 0);

  const stmt = db.prepare(
    `SELECT * FROM Staff${whereClause} ORDER BY last_name, first_name LIMIT ? OFFSET ?`
  );
  stmt.bind([limit, offset]);
  const data = stmtToArray<Staff>(stmt);

  return { data, total };
}

export function getAllStaff(activeOnly: boolean = true): Staff[] {
  const db = getDatabase();
  const sql = activeOnly
    ? 'SELECT * FROM Staff WHERE end_date IS NULL ORDER BY last_name, first_name'
    : 'SELECT * FROM Staff ORDER BY last_name, first_name';
  return execToArray<Staff>(db.exec(sql));
}

export function getStaffById(id: number): Staff | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM Staff WHERE id = ?');
  stmt.bind([id]);
  return stmtToObject<Staff>(stmt);
}

export function createStaff(
  staff: Omit<Staff, 'id' | 'created_at' | 'updated_at'>
): number {
  const db = getDatabase();
  db.run(
    `INSERT INTO Staff (
      employee_id, first_name, last_name, primary_role_id, employment_type,
      manager_id, start_date, end_date, site_id, attrition_probability
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      staff.employee_id,
      staff.first_name,
      staff.last_name,
      staff.primary_role_id,
      staff.employment_type,
      staff.manager_id,
      staff.start_date,
      staff.end_date,
      staff.site_id,
      staff.attrition_probability,
    ]
  );
  const id = getLastInsertId();
  saveDatabase();
  return id;
}

export function updateStaff(id: number, updates: Partial<Staff>): void {
  const clause = buildUpdateClause(updates, { skipFields: ['updated_at'] });
  if (!clause) return;

  const db = getDatabase();
  db.run(
    `UPDATE Staff SET ${clause.setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [...clause.values, id]
  );
  saveDatabase();
}

export function deleteStaff(id: number): void {
  const db = getDatabase();
  db.run('DELETE FROM Staff WHERE id = ?', [id]);
  saveDatabase();
}
