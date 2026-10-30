
import { query } from "../db.js";

// Use the organization's local calendar date for compliance calculations.
function getOrganizationToday(timezone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const dateParts = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

// Calculate one contractor's compliance from database rows.
function buildComplianceResult(contractorId, rows, today) {
  const issues = rows
    .map((row) => {
      if (!row.rule_id) return null;

      const required =
        row.is_required ||
        (row.works_on_site && row.required_for_site_work);

      let status = "Compliant";

      if (required && !row.document_id) {
        status = "Missing";
      } else if (
        row.document_id &&
        row.expiry_tracked &&
        row.expiry_date &&
        row.expiry_date < today
      ) {
        status = "Expired";
      } else if (
        row.document_id &&
        row.expiry_tracked &&
        row.expiry_date &&
        row.reminder_days > 0
      ) {
        const expiry = new Date(`${row.expiry_date}T00:00:00Z`);
        const current = new Date(`${today}T00:00:00Z`);
        const days = Math.floor((expiry - current) / 86400000);

        if (days >= 0 && days <= row.reminder_days) {
          status = "Expiring soon";
        }
      }

      return {
        ruleId: row.rule_id,
        documentTypeId: row.document_type_id,
        documentType: row.document_type,
        category: row.category,
        required,
        expiryTracked: row.expiry_tracked,
        reminderDays: row.reminder_days,
        documentId: row.document_id,
        expiryDate: row.expiry_date,
        status,
      };
    })
    .filter(Boolean);

  const priority = ["Expired", "Missing", "Expiring soon", "Compliant"];

  const status =
    priority.find((candidate) =>
      issues.some((issue) => issue.status === candidate),
    ) || "Compliant";

  const expiries = issues
    .filter((issue) => issue.expiryDate && issue.status !== "Expired")
    .map((issue) => issue.expiryDate)
    .sort();

  return {
    contractorId: Number(contractorId),
    status,
    issues,
    nextExpiry: expiries[0] || null,
    compliantCount: issues.filter((issue) => issue.status === "Compliant")
      .length,
    issueCount: issues.filter((issue) => issue.status !== "Compliant").length,
  };
}

// Compliance is derived from current document versions and organization rules,
// never trusted from client input.
export async function getContractorCompliance(organizationId, contractorId) {
  const { rows } = await query(
    `SELECT c.id AS contractor_id, c.works_on_site, r.id AS rule_id, r.category, r.is_required,
            r.required_for_site_work, r.expiry_tracked, r.reminder_days, r.is_active, o.timezone,
            dt.id AS document_type_id, dt.name AS document_type,
            d.id AS document_id, d.expiry_date, d.issue_date, d.scan_status, d.is_current
     FROM contractors c
     JOIN organizations o ON o.id = c.organization_id
     LEFT JOIN compliance_rules r ON r.organization_id = c.organization_id AND r.is_active = TRUE
     LEFT JOIN document_types dt ON dt.id = r.document_type_id
     LEFT JOIN documents d ON d.contractor_id = c.id
       AND d.document_type_id = dt.id
       AND d.organization_id = c.organization_id
       AND d.is_current = TRUE
       AND d.scan_status = 'clean'
     WHERE c.organization_id = $1 AND c.id = $2
     ORDER BY dt.name`,
    [organizationId, contractorId],
  );

  if (!rows.length) return null;

  const today = getOrganizationToday(rows[0].timezone);

  return buildComplianceResult(contractorId, rows, today);
}

// Bulk equivalent for organization-wide operations such as dashboard alerts.
export async function refreshOrganizationCompliance(organizationId) {
  const { rows } = await query(
    `SELECT
       c.id AS contractor_id,
       c.works_on_site,
       o.timezone,
       r.id AS rule_id,
       r.category,
       r.is_required,
       r.required_for_site_work,
       r.expiry_tracked,
       r.reminder_days,
       dt.id AS document_type_id,
       dt.name AS document_type,
       d.id AS document_id,
       d.expiry_date,
       d.issue_date,
       d.scan_status,
       d.is_current
     FROM contractors c
     JOIN organizations o ON o.id = c.organization_id
     LEFT JOIN compliance_rules r
       ON r.organization_id = c.organization_id
       AND r.is_active = TRUE
     LEFT JOIN document_types dt
       ON dt.id = r.document_type_id
     LEFT JOIN documents d
       ON d.contractor_id = c.id
       AND d.document_type_id = dt.id
       AND d.organization_id = c.organization_id
       AND d.is_current = TRUE
       AND d.scan_status = 'clean'
     WHERE c.organization_id = $1
     ORDER BY c.name, dt.name`,
    [organizationId],
  );

  const grouped = new Map();

  for (const row of rows) {
    if (!grouped.has(String(row.contractor_id))) {
      grouped.set(String(row.contractor_id), {
        contractorId: row.contractor_id,
        timezone: row.timezone,
        rows: [],
      });
    }

    grouped.get(String(row.contractor_id)).rows.push(row);
  }

  const results = [];

  for (const contractor of grouped.values()) {
    const today = getOrganizationToday(contractor.timezone);

    results.push(
      buildComplianceResult(
        contractor.contractorId,
        contractor.rows,
        today,
      ),
    );
  }

  if (results.length) {
    await query(
      `UPDATE contractors AS c
       SET status = v.status,
           next_expiry = v.next_expiry,
           updated_at = NOW()
       FROM UNNEST(
         $1::bigint[],
         $2::varchar[],
         $3::date[]
       ) AS v(id, status, next_expiry)
       WHERE c.id = v.id
         AND c.organization_id = $4`,
      [
        results.map((item) => item.contractorId),
        results.map((item) => item.status),
        results.map((item) => item.nextExpiry),
        organizationId,
      ],
    );
  }

  return results;
}

export async function refreshContractorSnapshot(organizationId, contractorId) {
  const result = await getContractorCompliance(organizationId, contractorId);

  if (!result) return null;

  await query(
    `UPDATE contractors
     SET status = $1,
         next_expiry = $2,
         updated_at = NOW()
     WHERE organization_id = $3 AND id = $4`,
    [result.status, result.nextExpiry, organizationId, contractorId],
  );

  return result;
}
