import { query } from "../db.js";

export async function getDocuments(req, res, next) {
  try {
    const { contractorId } = req.query;
    const values = contractorId ? [contractorId] : [];
    const result = await query(
      `SELECT d.id, d.contractor_id, d.reference_no, d.issue_date, d.expiry_date,
              d.file_name, d.notes, dt.name AS document_type,
              CASE
                WHEN d.expiry_date IS NULL THEN 'Missing'
                WHEN d.expiry_date < CURRENT_DATE THEN 'Expired'
                WHEN d.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'Expiring soon'
                ELSE 'Compliant'
              END AS status
       FROM documents d
       JOIN document_types dt ON dt.id = d.document_type_id
       ${contractorId ? "WHERE d.contractor_id = $1" : ""}
       ORDER BY d.expiry_date ASC NULLS FIRST`,
      values
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}
