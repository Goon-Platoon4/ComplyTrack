
import { query } from "../db.js";
import { refreshOrganizationCompliance } from "../services/complianceService.js";
import { toCsv } from "../utils/csv.js";
import { createTextPdf } from "../services/pdfService.js";

export async function getSummary(req, res, next) {
  try {
    const complianceResults = await refreshOrganizationCompliance(
      req.user.organizationId,
    );

    const result = {
      total: complianceResults.length,
      compliant: 0,
      expiring_soon: 0,
      expired: 0,
      missing: 0,
    };

    for (const contractor of complianceResults) {
      if (contractor.status === "Compliant") result.compliant += 1;
      else if (contractor.status === "Expiring soon") {
        result.expiring_soon += 1;
      } else if (contractor.status === "Expired") {
        result.expired += 1;
      } else if (contractor.status === "Missing") {
        result.missing += 1;
      }
    }

    return res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getComplianceReport(req, res, next) {
  try {
    const rows = await getComplianceRows(req);

    return res.json({
      generatedAt: new Date().toISOString(),
      organizationId: req.user.organizationId,
      count: rows.length,
      items: rows,
    });
  } catch (error) {
    next(error);
  }
}

export async function exportComplianceCsv(req, res, next) {
  try {
    const report = await getComplianceRows(req);

    const csv = toCsv(
      [
        "Contractor",
        "Registration number",
        "Category",
        "Overall status",
        "Next expiry",
        "Works on site",
        "Compliant checks",
        "Issues",
      ],
      report.map((row) => [
        row.name,
        row.registration,
        row.category,
        row.status,
        row.nextExpiry,
        row.worksOnSite ? "Yes" : "No",
        row.compliance?.compliantCount || 0,
        row.compliance?.issueCount || 0,
      ]),
    );

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="complytrack-compliance-${new Date().toISOString().slice(0, 10)}.csv"`,
    );

    return res.send(`\uFEFF${csv}`);
  } catch (error) {
    next(error);
  }
}

async function getComplianceRows(req) {
  const values = [req.user.organizationId];
  const where = ["c.organization_id = $1"];

  if (req.query.category) {
    values.push(String(req.query.category).slice(0, 100));
    where.push(`c.category = $${values.length}`);
  }

  if (req.query.search) {
    values.push(`%${String(req.query.search).slice(0, 150)}%`);
    where.push(
      `(c.name ILIKE $${values.length}
        OR c.registration_no ILIKE $${values.length}
        OR c.contact_name ILIKE $${values.length}
        OR COALESCE(c.contact_email, '') ILIKE $${values.length})`,
    );
  }

  const { rows } = await query(
    `SELECT
       c.id,
       c.name,
       c.registration_no AS registration,
       c.category,
       c.status,
       c.next_expiry AS "nextExpiry",
       c.works_on_site AS "worksOnSite"
     FROM contractors c
     WHERE ${where.join(" AND ")}
     ORDER BY c.name`,
    values,
  );

  // Refresh all contractor compliance snapshots in one bulk operation.
  const complianceResults = await refreshOrganizationCompliance(
    req.user.organizationId,
  );

  const complianceByContractor = new Map(
    complianceResults.map((item) => [
      String(item.contractorId),
      item,
    ]),
  );

  for (const row of rows) {
    row.compliance = complianceByContractor.get(String(row.id)) || null;

    if (row.compliance) {
      row.status = row.compliance.status;
      row.nextExpiry = row.compliance.nextExpiry;
    }
  }

  return req.query.status
    ? rows.filter((row) => row.status === req.query.status)
    : rows;
}

export async function exportCompliancePdf(req, res, next) {
  try {
    const rows = await getComplianceRows(req);

    const totals = rows.reduce((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {});

    const orgResult = await query(
      "SELECT name FROM organizations WHERE id = $1",
      [req.user.organizationId],
    );

    const lines = [
      `Organization: ${orgResult.rows[0]?.name || req.user.organizationId}`,
      `Organization ID: ${req.user.organizationId}`,
      `Filters: status=${req.query.status || "all"}, category=${req.query.category || "all"}, search=${req.query.search || "none"}`,
      `Total contractors: ${rows.length}`,
      `Compliant: ${totals.Compliant || 0} | Expiring soon: ${totals["Expiring soon"] || 0} | Expired: ${totals.Expired || 0} | Missing: ${totals.Missing || 0}`,
      "",
      "CONTRACTOR | REGISTRATION | CATEGORY | STATUS | NEXT EXPIRY | ISSUES",
      ...rows.map(
        (row) =>
          `${row.name} | ${row.registration} | ${row.category} | ${row.status} | ${row.nextExpiry || "-"} | ${row.compliance?.issueCount || 0}`,
      ),
    ];

    const pdf = createTextPdf("ComplyTrack Compliance Report", lines);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="complytrack-compliance-${new Date().toISOString().slice(0, 10)}.pdf"`,
    );

    return res.send(pdf);
  } catch (error) {
    next(error);
  }
}
