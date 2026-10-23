import { query } from "../db.js";

// Recalculates contractors.status and contractors.next_expiry from their documents.
// Pass a contractor id to refresh one contractor, or nothing to refresh everyone.
//
// Rules:
// - Required documents: every document type, except site-work types (COIDA,
//   public liability, OHS agreement) which only apply when works_on_site is true.
// - For each required type the newest expiry date counts.
// - Status is the worst result: Missing > Expired > Expiring soon (30 days) > Compliant.
export async function refreshContractorStatus(contractorId = null) {
  await query(
    `UPDATE contractors c
     SET status = s.status, next_expiry = s.next_expiry, updated_at = NOW()
     FROM (
       SELECT c2.id,
              CASE
                WHEN bool_or(latest.expiry IS NULL) THEN 'Missing'
                WHEN bool_or(latest.expiry < CURRENT_DATE) THEN 'Expired'
                WHEN bool_or(latest.expiry <= CURRENT_DATE + 30) THEN 'Expiring soon'
                ELSE 'Compliant'
              END AS status,
              MIN(latest.expiry) AS next_expiry
       FROM contractors c2
       JOIN document_types dt ON (NOT dt.required_for_site_work OR c2.works_on_site)
       LEFT JOIN LATERAL (
         SELECT MAX(d.expiry_date) AS expiry
         FROM documents d
         WHERE d.contractor_id = c2.id AND d.document_type_id = dt.id
       ) latest ON TRUE
       WHERE $1::bigint IS NULL OR c2.id = $1::bigint
       GROUP BY c2.id
     ) s
     WHERE c.id = s.id
       AND (c.status IS DISTINCT FROM s.status OR c.next_expiry IS DISTINCT FROM s.next_expiry)`,
    [contractorId]
  );
}