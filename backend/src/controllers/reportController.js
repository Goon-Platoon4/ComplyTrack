import { query } from "../db.js";

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
