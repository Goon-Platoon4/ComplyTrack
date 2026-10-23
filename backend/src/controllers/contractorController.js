import { query } from "../db.js";

// Columns returned for a contractor. Dates are cast to text so they come back
// as "2026-03-01" instead of shifting a day because of time zones.
const CONTRACTOR_COLUMNS = `
  id, name, registration_no AS registration, category, contact_name AS contact,
  contact_email AS email, contact_phone AS phone, works_on_site AS "worksOnSite",
  status, next_expiry::text AS "nextExpiry",
  contract_start::text AS "contractStart", contract_end::text AS "contractEnd"
`;

function isValidId(id) {
  return /^\d+$/.test(id);
}

function validateContractor(body) {
  const required = ["name", "registration", "category", "contact"];
  const missing = required.filter((field) => !body[field] || !String(body[field]).trim());
  if (missing.length) return `Missing required fields: ${missing.join(", ")}`;
  if (body.contractStart && body.contractEnd && body.contractStart > body.contractEnd) {
    return "contractStart must be before contractEnd";
  }
  return null;
}

function contractorValues(body) {
  return [
    String(body.name).trim(),
    String(body.registration).trim(),
    String(body.category).trim(),
    String(body.contact).trim(),
    body.email || null,
    body.phone || null,
    Boolean(body.worksOnSite),
    body.contractStart || null,
    body.contractEnd || null,
  ];
}

export async function getContractors(req, res, next) {
  try {
    const { search, status, category } = req.query;
    const values = [];
    const where = [];

    if (search) {
      values.push(`%${search}%`);
      where.push(`(name ILIKE $${values.length} OR registration_no ILIKE $${values.length} OR contact_name ILIKE $${values.length})`);
    }
    if (status) {
      values.push(status);
      where.push(`status = $${values.length}`);
    }
    if (category) {
      values.push(category);
      where.push(`category = $${values.length}`);
    }

    const sql = `
      SELECT ${CONTRACTOR_COLUMNS}
      FROM contractors
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY name ASC
    `;
    const result = await query(sql, values);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

export async function getContractorById(req, res, next) {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid contractor id" });

    const result = await query(`SELECT ${CONTRACTOR_COLUMNS} FROM contractors WHERE id = $1`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ message: "Contractor not found" });
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

export async function createContractor(req, res, next) {
  try {
    const error = validateContractor(req.body);
    if (error) return res.status(400).json({ message: error });

    const result = await query(
      `INSERT INTO contractors
         (name, registration_no, category, contact_name, contact_email, contact_phone,
          works_on_site, contract_start, contract_end)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING ${CONTRACTOR_COLUMNS}`,
      contractorValues(req.body)
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ message: "Registration number already exists" });
    next(error);
  }
}

export async function updateContractor(req, res, next) {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid contractor id" });

    const error = validateContractor(req.body);
    if (error) return res.status(400).json({ message: error });

    const result = await query(
      `UPDATE contractors
       SET name = $1, registration_no = $2, category = $3, contact_name = $4,
           contact_email = $5, contact_phone = $6, works_on_site = $7,
           contract_start = $8, contract_end = $9, updated_at = NOW()
       WHERE id = $10
       RETURNING ${CONTRACTOR_COLUMNS}`,
      [...contractorValues(req.body), req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: "Contractor not found" });
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ message: "Registration number already exists" });
    next(error);
  }
}

export async function deleteContractor(req, res, next) {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: "Invalid contractor id" });

    const result = await query("DELETE FROM contractors WHERE id = $1 RETURNING id", [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ message: "Contractor not found" });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}