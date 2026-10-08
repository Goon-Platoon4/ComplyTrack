import { query } from "../db.js";

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
      SELECT id, name, registration_no AS registration, category, contact_name AS contact,
             contact_email AS email, contact_phone AS phone, works_on_site AS "worksOnSite",
             status, next_expiry AS "nextExpiry"
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
    const result = await query(
      `SELECT id, name, registration_no AS registration, category, contact_name AS contact,
              contact_email AS email, contact_phone AS phone, works_on_site AS "worksOnSite",
              status, next_expiry AS "nextExpiry", contract_start, contract_end
       FROM contractors WHERE id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: "Contractor not found" });
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}
