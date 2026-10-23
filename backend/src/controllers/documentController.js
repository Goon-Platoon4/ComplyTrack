import { query } from "../db.js";
import { refreshContractorStatus } from "../services/complianceService.js";

// Dates are cast to text so they come back as "2026-03-01" instead of
// shifting a day because of time zones.
const DOCUMENT_COLUMNS = `
  d.id, d.contractor_id AS "contractorId", d.document_type_id AS "documentTypeId",
  dt.name AS "documentType", d.reference_no AS "referenceNumber",
  d.issue_date::text AS "issueDate", d.expiry_date::text AS "expiryDate",
  d.file_name AS "fileName", d.notes, d.created_at AS "createdAt", d.updated_at AS "updatedAt"
`;

const DOCUMENT_STATUS = `
  CASE
    WHEN d.expiry_date IS NULL THEN 'Missing'
    WHEN d.expiry_date < CURRENT_DATE THEN 'Expired'
    WHEN d.expiry_date <= CURRENT_DATE + 30 THEN 'Expiring soon'
    ELSE 'Compliant'
  END
`;

const isNumericId = (id) => /^\d+$/.test(String(id));
const isUuid = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
const isDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));

function validateDocument(body, { requireContractor }) {
  if (requireContractor && !isNumericId(body.contractorId)) return "contractorId is required";
  if (!isNumericId(body.documentTypeId)) return "documentTypeId is required";
  if (!body.expiryDate || !isDate(body.expiryDate)) return "expiryDate is required (YYYY-MM-DD)";
  if (body.issueDate && !isDate(body.issueDate)) return "issueDate must be YYYY-MM-DD";
  if (body.issueDate && body.issueDate > body.expiryDate) return "issueDate must be before expiryDate";
  return null;
}

async function findDocument(id) {
  const result = await query(
    `SELECT ${DOCUMENT_COLUMNS}, ${DOCUMENT_STATUS} AS status
     FROM documents d
     JOIN document_types dt ON dt.id = d.document_type_id
     WHERE d.id = $1`,
    [id]
  );
  return result.rows[0];
}

export async function getDocumentTypes(_req, res, next) {
  try {
    const result = await query(
      `SELECT id, name, description, required_for_site_work AS "requiredForSiteWork"
       FROM document_types ORDER BY id`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

export async function getDocuments(req, res, next) {
  try {
    const { contractorId } = req.query;
    if (contractorId && !isNumericId(contractorId)) {
      return res.status(400).json({ message: "Invalid contractorId" });
    }

    const values = contractorId ? [contractorId] : [];
    const result = await query(
      `SELECT ${DOCUMENT_COLUMNS}, ${DOCUMENT_STATUS} AS status
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

// Every required document type for one contractor, including ones never uploaded.
export async function getContractorChecklist(req, res, next) {
  try {
    const { contractorId } = req.params;
    if (!isNumericId(contractorId)) return res.status(400).json({ message: "Invalid contractor id" });

    const contractor = await query("SELECT works_on_site FROM contractors WHERE id = $1", [contractorId]);
    if (!contractor.rows[0]) return res.status(404).json({ message: "Contractor not found" });

    const result = await query(
      `SELECT dt.id AS "documentTypeId", dt.name AS "documentType",
              d.id AS "documentId", d.reference_no AS "referenceNumber",
              d.issue_date::text AS "issueDate", d.expiry_date::text AS "expiryDate",
              d.file_name AS "fileName",
              ${DOCUMENT_STATUS} AS status
       FROM document_types dt
       LEFT JOIN LATERAL (
         SELECT * FROM documents
         WHERE contractor_id = $1 AND document_type_id = dt.id
         ORDER BY expiry_date DESC NULLS LAST, created_at DESC
         LIMIT 1
       ) d ON TRUE
       WHERE NOT dt.required_for_site_work OR $2
       ORDER BY dt.id`,
      [contractorId, contractor.rows[0].works_on_site]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
}

export async function getDocumentById(req, res, next) {
  try {
    if (!isUuid(req.params.id)) return res.status(400).json({ message: "Invalid document id" });

    const document = await findDocument(req.params.id);
    if (!document) return res.status(404).json({ message: "Document not found" });
    res.json(document);
  } catch (error) {
    next(error);
  }
}

export async function createDocument(req, res, next) {
  try {
    const error = validateDocument(req.body, { requireContractor: true });
    if (error) return res.status(400).json({ message: error });

    const { contractorId, documentTypeId, referenceNumber, issueDate, expiryDate, fileName, notes } = req.body;
    const result = await query(
      `INSERT INTO documents
         (contractor_id, document_type_id, reference_no, issue_date, expiry_date, file_name, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [contractorId, documentTypeId, referenceNumber || null, issueDate || null, expiryDate, fileName || null, notes || null]
    );

    await refreshContractorStatus(contractorId);
    res.status(201).json(await findDocument(result.rows[0].id));
  } catch (error) {
    if (error.code === "23503") return res.status(400).json({ message: "Contractor or document type does not exist" });
    next(error);
  }
}

export async function updateDocument(req, res, next) {
  try {
    if (!isUuid(req.params.id)) return res.status(400).json({ message: "Invalid document id" });

    const error = validateDocument(req.body, { requireContractor: false });
    if (error) return res.status(400).json({ message: error });

    const { documentTypeId, referenceNumber, issueDate, expiryDate, fileName, notes } = req.body;
    const result = await query(
      `UPDATE documents
       SET document_type_id = $1, reference_no = $2, issue_date = $3, expiry_date = $4,
           file_name = $5, notes = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING contractor_id`,
      [documentTypeId, referenceNumber || null, issueDate || null, expiryDate, fileName || null, notes || null, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ message: "Document not found" });

    await refreshContractorStatus(result.rows[0].contractor_id);
    res.json(await findDocument(req.params.id));
  } catch (error) {
    if (error.code === "23503") return res.status(400).json({ message: "Document type does not exist" });
    next(error);
  }
}

export async function deleteDocument(req, res, next) {
  try {
    if (!isUuid(req.params.id)) return res.status(400).json({ message: "Invalid document id" });

    const result = await query("DELETE FROM documents WHERE id = $1 RETURNING contractor_id", [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ message: "Document not found" });

    await refreshContractorStatus(result.rows[0].contractor_id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}