import { query } from "../db.js";

const isDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));

export async function getSummary(_req, res, next) {
  try {
    const result = await query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'Compliant')::int AS compliant,
        COUNT(*) FILTER (WHERE status = 'Expiring soon')::int AS expiring_soon,
        COUNT(*) FILTER (WHERE status = 'Expired')::int AS expired,
        COUNT(*) FILTER (WHERE status = 'Missing')::int AS missing
      FROM contractors
    `);
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

// Contractor report with the same filters as the Reports page, including
// the expiry date range, plus how many documents each contractor has.
export async function getContractorReport(req, res, next) {
  try {
    const { search, status, category, expiryFrom, expiryTo } = req.query;
    if ((expiryFrom && !isDate(expiryFrom)) || (expiryTo && !isDate(expiryTo))) {
      return res.status(400).json({ message: "expiryFrom and expiryTo must be YYYY-MM-DD" });
    }

    const values = [];
    const where = [];

    if (search) {
      values.push(`%${search}%`);
      where.push(`(c.name ILIKE $${values.length} OR c.registration_no ILIKE $${values.length} OR c.contact_name ILIKE $${values.length})`);
    }
    if (status) {
      values.push(status);
      where.push(`c.status = $${values.length}`);
    }
    if (category) {
      values.push(category);
      where.push(`c.category = $${values.length}`);
    }
    if (expiryFrom) {
      values.push(expiryFrom);
      where.push(`c.next_expiry >= $${values.length}`);
    }
    if (expiryTo) {
      values.push(expiryTo);
      where.push(`c.next_expiry <= $${values.length}`);
    }

    const result = await query(
      `SELECT c.id, c.name, c.registration_no AS registration, c.category,
              c.contact_name AS contact, c.contact_email AS email, c.contact_phone AS phone,
              c.works_on_site AS "worksOnSite", c.status, c.next_expiry::text AS "nextExpiry",
              (SELECT COUNT(*)::int FROM documents d WHERE d.contractor_id = c.id) AS "documentCount"
       FROM contractors c
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY c.name ASC`,
      values
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

// Current documents that expire within the next `days` days (default 30),
// including ones that have already expired. Older versions of a document that
// has since been renewed are ignored.
export async function getExpiringDocuments(req, res, next) {
  try {
    const days = req.query.days === undefined ? 30 : Number(req.query.days);
    if (!Number.isInteger(days) || days < 0 || days > 365) {
      return res.status(400).json({ message: "days must be a whole number from 0 to 365" });
    }

    const result = await query(
      `SELECT * FROM (
         SELECT DISTINCT ON (d.contractor_id, d.document_type_id)
                d.id, d.contractor_id AS "contractorId", c.name AS "contractorName",
                dt.name AS "documentType", d.reference_no AS "referenceNumber",
                d.expiry_date::text AS "expiryDate",
                (d.expiry_date - CURRENT_DATE) AS "daysLeft",
                CASE
                  WHEN d.expiry_date < CURRENT_DATE THEN 'Expired'
                  WHEN d.expiry_date <= CURRENT_DATE + 30 THEN 'Expiring soon'
                  ELSE 'Compliant'
                END AS status,
                d.expiry_date AS sort_date
         FROM documents d
         JOIN contractors c ON c.id = d.contractor_id
         JOIN document_types dt ON dt.id = d.document_type_id
         ORDER BY d.contractor_id, d.document_type_id, d.expiry_date DESC NULLS LAST, d.created_at DESC
       ) latest
       WHERE sort_date <= CURRENT_DATE + $1::int
       ORDER BY sort_date ASC`,
      [days]
    );
    res.json(result.rows.map(({ sort_date: _sortDate, ...row }) => row));
  } catch (error) {
    next(error);
  }
}

// Status counts per contractor category.
export async function getCategoryBreakdown(_req, res, next) {
  try {
    const result = await query(`
      SELECT category,
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE status = 'Compliant')::int AS compliant,
             COUNT(*) FILTER (WHERE status = 'Expiring soon')::int AS expiring_soon,
             COUNT(*) FILTER (WHERE status = 'Expired')::int AS expired,
             COUNT(*) FILTER (WHERE status = 'Missing')::int AS missing
      FROM contractors
      GROUP BY category
      ORDER BY category ASC
    `);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}