import { getDatabase, saveDatabase } from './initDatabase';

/**
 * Populate database with synthetic test data
 * Creates realistic examples for core tables
 */
export async function seedDatabase() {
  const db = getDatabase();

  try {
    db.run('BEGIN TRANSACTION');

    // ========================================================================
    // 1. SITES
    // ========================================================================
    db.run(`
      INSERT INTO Sites (site_name, location, building_capacity, desk_count, timezone)
      VALUES
        ('London Head Office', 'London, UK', 500, 450, 'Europe/London'),
        ('Manchester Centre', 'Manchester, UK', 300, 280, 'Europe/London'),
        ('Manila Operations', 'Manila, Philippines', 1000, 900, 'Asia/Manila');
    `);

    // ========================================================================
    // 2. ROLES
    // ========================================================================
    db.run(`
      INSERT INTO Roles (role_name, role_type, reports_to_role_id)
      VALUES
        ('Operations Manager', 'Manager', NULL),          -- id=1 (top level)
        ('Team Leader', 'TeamLeader', 1),                 -- id=2
        ('Voice Agent', 'Agent', 2),                      -- id=3
        ('Chat Agent', 'Agent', 2),                       -- id=4
        ('Email Agent', 'Agent', 2),                      -- id=5
        ('QA Analyst', 'QA', 1),                          -- id=6
        ('Trainer', 'Trainer', 1);                        -- id=7
    `);

    // ========================================================================
    // 3. STAFF (50 staff members)
    // ========================================================================
    const staffInserts = [];
    const firstNames = ['Alice', 'Bob', 'Carol', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Isla', 'James'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

    // Manager
    staffInserts.push(`('EMP001', 'Sarah', 'Thompson', 1, 'Full-time', NULL, '2020-01-01', NULL, 1, 0.08)`);

    // Team Leaders
    for (let i = 1; i <= 5; i++) {
      staffInserts.push(`('EMP00${i + 1}', '${firstNames[i % 10]}', '${lastNames[i % 10]}', 2, 'Full-time', 1, '2021-0${(i % 5) + 1}-15', NULL, ${(i % 3) + 1}, 0.10)`);
    }

    // Agents (30 voice, 10 chat, 10 email)
    let empNum = 7;
    for (let i = 0; i < 30; i++) {
      const roleId = 3; // Voice agent
      const managerId = 2 + (i % 5); // Distribute across TLs
      const siteId = (i % 3) + 1;
      const startDate = `2023-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`;
      const employmentType = i % 10 === 0 ? 'Part-time' : 'Full-time';
      const attrition = i < 10 ? 0.35 : (i < 20 ? 0.20 : 0.15); // New hires have higher attrition

      staffInserts.push(`('EMP${String(empNum).padStart(3, '0')}', '${firstNames[i % 10]}', '${lastNames[(i + 3) % 10]}', ${roleId}, '${employmentType}', ${managerId}, '${startDate}', NULL, ${siteId}, ${attrition})`);
      empNum++;
    }

    for (let i = 0; i < 10; i++) {
      const roleId = 4; // Chat agent
      const managerId = 2 + (i % 5);
      const siteId = (i % 3) + 1;
      const startDate = `2024-${String((i % 12) + 1).padStart(2, '0')}-01`;

      staffInserts.push(`('EMP${String(empNum).padStart(3, '0')}', '${firstNames[(i + 5) % 10]}', '${lastNames[(i + 7) % 10]}', ${roleId}, 'Full-time', ${managerId}, '${startDate}', NULL, ${siteId}, 0.20)`);
      empNum++;
    }

    for (let i = 0; i < 5; i++) {
      const roleId = 5; // Email agent
      const managerId = 2 + (i % 5);
      const siteId = (i % 3) + 1;
      const startDate = `2024-${String((i % 6) + 1).padStart(2, '0')}-15`;

      staffInserts.push(`('EMP${String(empNum).padStart(3, '0')}', '${firstNames[(i + 2) % 10]}', '${lastNames[(i + 5) % 10]}', ${roleId}, 'Full-time', ${managerId}, '${startDate}', NULL, ${siteId}, 0.18)`);
      empNum++;
    }

    // QA and Trainers
    staffInserts.push(`('EMP${String(empNum).padStart(3, '0')}', 'Quality', 'Assurance', 6, 'Full-time', 1, '2022-03-01', NULL, 1, 0.10)`);
    empNum++;
    staffInserts.push(`('EMP${String(empNum).padStart(3, '0')}', 'Training', 'Expert', 7, 'Full-time', 1, '2022-06-01', NULL, 1, 0.08)`);

    db.run(`
      INSERT INTO Staff (employee_id, first_name, last_name, primary_role_id, employment_type, manager_id, start_date, end_date, site_id, attrition_probability)
      VALUES ${staffInserts.join(',\n')};
    `);

    // ========================================================================
    // 4. SKILLS
    // ========================================================================
    db.run(`
      INSERT INTO Skills (skill_name, skill_type, description)
      VALUES
        ('Inbound Voice', 'Voice', 'Phone support'),
        ('Outbound Voice', 'Voice', 'Sales calls'),
        ('Live Chat', 'Chat', 'Web chat support'),
        ('Email Support', 'Email', 'Email handling'),
        ('Technical Support L1', 'Technical', 'Basic troubleshooting'),
        ('Technical Support L2', 'Technical', 'Advanced troubleshooting'),
        ('Collections', 'Collections', 'Debt recovery'),
        ('Marketing Campaigns', 'Marketing', 'Outbound marketing'),
        ('Social Media', 'Media', 'Social media response'),
        ('Response Handling', 'Response', 'Standard response handling');
    `);

    // ========================================================================
    // 5. STAFFSKILLS (assign skills to staff)
    // ========================================================================
    const skillInserts = [];

    // Voice agents (EMP007-EMP036) get Inbound Voice skill
    for (let i = 7; i <= 36; i++) {
      const proficiency = i <= 16 ? 2 : (i <= 26 ? 3 : 4); // Mix of proficiencies
      skillInserts.push(`(${i}, 1, ${proficiency}, '2023-${String((i % 12) + 1).padStart(2, '0')}-01')`);
    }

    // Chat agents (EMP037-EMP046) get Live Chat skill
    for (let i = 37; i <= 46; i++) {
      skillInserts.push(`(${i}, 3, 3, '2024-${String((i % 12) + 1).padStart(2, '0')}-01')`);
    }

    // Email agents (EMP047-EMP051) get Email Support skill
    for (let i = 47; i <= 51; i++) {
      skillInserts.push(`(${i}, 4, 3, '2024-${String((i % 6) + 1).padStart(2, '0')}-15')`);
    }

    // Some agents have multiple skills (multi-skilled)
    skillInserts.push(`(10, 3, 2, '2024-01-15')`); // Voice agent also does chat
    skillInserts.push(`(15, 5, 3, '2023-06-01')`); // Voice agent also does tech support L1
    // (20, 1) is already assigned in the Voice loop above
    skillInserts.push(`(20, 5, 4, '2023-01-01')`); // Also tech L1
    skillInserts.push(`(20, 6, 3, '2024-01-01')`); // Also tech L2

    db.run(`
      INSERT INTO StaffSkills (staff_id, skill_id, proficiency_level, acquired_date)
      VALUES ${skillInserts.join(',\n')};
    `);

    // ========================================================================
    // 6. CLIENTS
    // ========================================================================
    db.run(`
      INSERT INTO Clients (client_name, industry, payment_terms, invoice_frequency, active)
      VALUES
        ('ACME Corporation', 'Retail', 30, 'monthly', 1),
        ('TechRetail Ltd', 'E-commerce', 45, 'monthly', 1),
        ('HealthFirst Insurance', 'Insurance', 60, 'quarterly', 1),
        ('GlobalBank PLC', 'Finance', 30, 'monthly', 1);
    `);

    // ========================================================================
    // 7. CAMPAIGNS
    // ========================================================================
    db.run(`
      INSERT INTO Campaigns (campaign_name, client_id, channel_type, start_date, end_date, sla_target_percent, sla_threshold_seconds, concurrency_allowed, active)
      VALUES
        ('ACME Sales Inbound', 1, 'Voice', '2024-01-15', NULL, 80.0, 20, 1, 1),
        ('ACME Support Chat', 1, 'Chat', '2024-02-01', NULL, 85.0, 60, 3, 1),
        ('ACME Email Support', 1, 'Email', '2024-01-15', NULL, 90.0, 86400, 1, 1),
        ('TechRetail Customer Service', 2, 'Voice', '2023-06-15', NULL, 90.0, 30, 1, 1),
        ('TechRetail Social Chat', 2, 'Chat', '2024-01-01', NULL, 85.0, 60, 3, 1),
        ('HealthFirst Claims Line', 3, 'Voice', '2024-03-01', NULL, 80.0, 20, 1, 1),
        ('GlobalBank Support', 4, 'Voice', '2024-01-01', NULL, 85.0, 20, 1, 1);
    `);

    // ========================================================================
    // 8. CONTRACTS
    // ========================================================================
    db.run(`
      INSERT INTO Contracts (client_id, contract_number, start_date, end_date, currency, auto_renew, notice_period_days)
      VALUES
        (1, 'ACME-2024-001', '2024-01-01', '2025-12-31', 'GBP', 0, 90),
        (2, 'TECH-2023-001', '2023-06-15', NULL, 'USD', 0, 90),
        (3, 'HEALTH-2024-001', '2024-03-01', '2026-02-28', 'GBP', 0, 90),
        (4, 'BANK-2024-001', '2024-01-01', '2025-12-31', 'GBP', 1, 60);
    `);

    // ========================================================================
    // 9. BILLINGRULES (realistic pricing)
    // ========================================================================
    db.run(`
      INSERT INTO BillingRules (contract_id, campaign_id, billing_model, rate, penalty_per_sla_point, reward_per_sla_point, valid_from, valid_to)
      VALUES
        -- ACME: PerFTE (£2,000/month baseline)
        (1, 1, 'PerFTE', 2000.00, 50.00, 25.00, '2024-01-01', '2024-12-31'),
        (1, 2, 'PerFTE', 1800.00, 50.00, 25.00, '2024-02-01', NULL),

        -- TechRetail: PerTransaction (£2/call)
        (2, 4, 'PerTransaction', 2.00, 0.0, 0.0, '2023-06-15', NULL),

        -- HealthFirst: PerHandleMinute (£0.50/min)
        (3, 6, 'PerHandleMinute', 0.50, 0.0, 0.0, '2024-03-01', NULL),

        -- GlobalBank: Hybrid (£2,000/FTE base + £1/transaction)
        (4, NULL, 'PerFTE', 2000.00, 0.0, 0.0, '2024-01-01', NULL),
        (4, 7, 'PerTransaction', 1.00, 0.0, 0.0, '2024-01-01', NULL);
    `);

    // ========================================================================
    // 10. ASSUMPTIONS (time-bound parameters)
    // ========================================================================
    db.run(`
      INSERT INTO Assumptions (assumption_type, value, unit, valid_from, valid_to, campaign_id)
      VALUES
        -- Global defaults
        ('Shrinkage', 25, 'percent', '2024-01-01', NULL, NULL),
        ('Occupancy', 85, 'percent', '2024-01-01', NULL, NULL),

        -- Campaign-specific AHT
        ('AHT', 240, 'seconds', '2024-01-01', NULL, 1),  -- ACME Sales: 4 mins
        ('AHT', 180, 'seconds', '2024-02-01', NULL, 2),  -- ACME Chat: 3 mins
        ('AHT', 300, 'seconds', '2024-01-01', NULL, 3),  -- ACME Email: 5 mins
        ('AHT', 360, 'seconds', '2023-06-15', NULL, 4),  -- TechRetail: 6 mins

        -- Average Patience (for Erlang A/X)
        ('AveragePatience', 120, 'seconds', '2024-01-01', NULL, NULL);  -- 2 mins
    `);

    // ========================================================================
    // 11. SCENARIOS
    // ========================================================================
    db.run(`
      INSERT INTO Scenarios (scenario_name, description, is_baseline)
      VALUES
        ('Baseline 2025', 'Current assumptions and volume trends', 1),
        ('Optimistic Growth', '+20% volume increase', 0),
        ('AHT Improvement', 'AHT reduced by 15%', 0),
        ('High Abandonment Stress Test', 'Voice + chat spike with low patience', 0);
    `);

    // ========================================================================
    // 12. PRODUCTIVITYCURVES
    // ========================================================================
    db.run(`
      INSERT INTO ProductivityCurves (curve_name, curve_type, days_to_full_productivity, day_1_percent, day_7_percent, day_30_percent)
      VALUES
        ('New Hire Onboarding', 'S-Curve', 30, 40.0, 60.0, 100.0),
        ('Post-Training Recovery', 'Linear', 14, 70.0, 85.0, 100.0),
        ('Quick Ramp', 'Linear', 7, 80.0, 100.0, 100.0);
    `);

    // ========================================================================
    // 13. ATTRITIONCURVES
    // ========================================================================
    db.run(`
      INSERT INTO AttritionCurves (curve_name, tenure_min_months, tenure_max_months, annual_attrition_rate)
      VALUES
        ('New Hire (0-3 months)', 0, 3, 0.50),
        ('Early Tenure (3-6 months)', 3, 6, 0.35),
        ('Mid Tenure (6-12 months)', 6, 12, 0.20),
        ('Established (12+ months)', 12, NULL, 0.12);
    `);

    // ========================================================================
    // 14. RECRUITMENTPIPELINE
    // ========================================================================
    db.run(`
      INSERT INTO RecruitmentPipeline (stage_name, stage_order, pass_rate, avg_duration_days)
      VALUES
        ('Application', 1, 0.70, 2),
        ('Screening Call', 2, 0.50, 3),
        ('Interview', 3, 0.40, 5),
        ('Offer', 4, 0.80, 2),
        ('Acceptance', 5, 0.90, 3),
        ('Start Date', 6, 1.00, 14);
    `);

    // ========================================================================
    // 15. SUPPORTINGRESOURCES
    // ========================================================================
    db.run(`
      INSERT INTO SupportingResources (resource_type, resource_name, site_id, quantity, cost_per_unit, valid_from, valid_to)
      VALUES
        ('ACD_Seat', 'Avaya Seats', 1, 500, 25.00, '2024-01-01', NULL),
        ('CRM_Licence', 'Salesforce Licences', NULL, 300, 75.00, '2024-01-01', NULL),
        ('Desk', 'Workstations', 1, 450, 0.00, '2024-01-01', NULL),
        ('Desk', 'Workstations', 2, 280, 0.00, '2024-01-01', NULL),
        ('Desk', 'Workstations', 3, 900, 0.00, '2024-01-01', NULL);
    `);

    // ========================================================================
    // 16. SCHEDULING DEFAULTS
    // ========================================================================
    db.run(`
      INSERT INTO ShiftTemplates (template_name, paid_minutes, unpaid_minutes, break_count, break_minutes)
      VALUES
        ('Standard 9h (8 paid + 1 lunch)', 480, 60, 2, 15);
    `);

    db.run(`
      INSERT INTO OptimizationMethods (method_key, method_name, version, description)
      VALUES
        ('greedy', 'Greedy Fill', '1.0', 'Baseline gap-first fill'),
        ('local_search', 'Local Search', '1.0', 'Iterative swap-based improvement'),
        ('solver', 'Solver', '0.1', 'Placeholder for ILP/CP-SAT solver');
    `);

    db.run('COMMIT');
    saveDatabase();
  } catch (err) {
    db.run('ROLLBACK');
    console.error('Seeding failed:', err);
    throw err;
  }
}

/**
 * Check if database has been seeded
 */
export function isDatabaseSeeded(): boolean {
  const db = getDatabase();

  const result = db.exec('SELECT COUNT(*) as count FROM Staff');
  const count = result[0]?.values[0]?.[0] as number;

  return count > 0;
}
