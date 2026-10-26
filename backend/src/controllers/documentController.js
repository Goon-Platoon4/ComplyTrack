import { query } from "../db.js";
import { refreshContractorSnapshot } from "../services/complianceService.js";
import { recordAudit } from "../services/auditService.js";

export async function getDocuments(req, res, next) {
  try {
    const values = [req.user.organizationId];
    let where = "d.organization_id=$1 AND d.is_current=TRUE";
    if (req.query.contractorId) {
      values.push(req.query.contractorId);
      where += ` AND d.contractor_id=$${values.length}`;
    }
    if (req.query.scanStatus) {
      values.push(req.query.scanStatus);
      where += ` AND d.scan_status=$${values.length}`;
    }
    const { rows } = await query(
      `SELECT d.id,d.contractor_id AS "contractorId",d.document_type_id AS "documentTypeId",d.reference_no AS "referenceNo",
      d.issue_date AS "issueDate",d.expiry_date AS "expiryDate",d.file_name AS "fileName",d.mime_type AS "mimeType",d.file_size_bytes AS "fileSizeBytes",
      d.version_number AS "versionNumber",d.scan_status AS "scanStatus",d.uploaded_at AS "uploadedAt",d.notes,dt.name AS "documentType",
      CASE WHEN d.scan_status <> 'clean' THEN 'Unavailable' WHEN r.expiry_tracked=FALSE THEN 'Compliant' WHEN d.expiry_date IS NULL THEN 'Compliant'
        WHEN d.expiry_date < (NOW() AT TIME ZONE o.timezone)::date THEN 'Expired'
        WHEN r.reminder_days>0 AND d.expiry_date <= (NOW() AT TIME ZONE o.timezone)::date + r.reminder_days THEN 'Expiring soon' ELSE 'Compliant' END AS status
      FROM documents d JOIN contractors c ON c.id=d.contractor_id AND c.organization_id=d.organization_id
      JOIN document_types dt ON dt.id=d.document_type_id JOIN organizations o ON o.id=d.organization_id
      LEFT JOIN compliance_rules r ON r.organization_id=d.organization_id AND r.document_type_id=d.document_type_id
      WHERE ${where} ORDER BY d.expiry_date ASC NULLS FIRST,d.uploaded_at DESC`,
      values,
    );
    return res.json(rows);
  } catch (error) {
    next(error);
  }
}

export async function getDocumentHistory(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT d.id,d.contractor_id AS "contractorId",d.document_type_id AS "documentTypeId",d.reference_no AS "referenceNo",
      d.issue_date AS "issueDate",d.expiry_date AS "expiryDate",d.file_name AS "fileName",d.mime_type AS "mimeType",d.file_size_bytes AS "fileSizeBytes",
      d.version_number AS "versionNumber",d.is_current AS "isCurrent",d.scan_status AS "scanStatus",d.uploaded_at AS "uploadedAt",d.notes,u.full_name AS "uploadedBy"
      FROM documents d LEFT JOIN users u ON u.id=d.uploaded_by WHERE d.organization_id=$1 AND d.contractor_id=$2 AND d.document_type_id=$3 ORDER BY d.version_number DESC`,
      [
        req.user.organizationId,
        req.params.contractorId,
        req.params.documentTypeId,
      ],
    );
    return res.json(rows);
  } catch (error) {
    next(error);
  }
}

export async function createDocumentMetadata(req, res, next) {
  if (!["Administrator", "Compliance Officer"].includes(req.user.role))
    return res.status(403).json({ message: "Insufficient permissions" });
  // Metadata-only uploads are intentionally not published. The storage/scanner pipeline must call the finalization service.
  return res
    .status(501)
    .json({
      message:
        "Document upload requires configured private storage and malware scanning. No document was saved.",
    });
}

export async function getContractorDocuments(req, res, next) {
  try {
    const contractor = await query(
      "SELECT id FROM contractors WHERE organization_id=$1 AND id=$2",
      [req.user.organizationId, req.params.contractorId],
    );
    if (!contractor.rowCount)
      return res.status(404).json({ message: "Contractor not found" });
    const result = await query(
      `SELECT r.document_type_id AS "documentTypeId",dt.name AS "documentType",r.is_required AS required,
      r.required_for_site_work AS "requiredForSiteWork",r.expiry_tracked AS "expiryTracked",r.reminder_days AS "reminderDays",
      d.id AS "documentId",d.expiry_date AS "expiryDate",d.version_number AS "versionNumber",d.scan_status AS "scanStatus"
      FROM compliance_rules r JOIN document_types dt ON dt.id=r.document_type_id
      LEFT JOIN documents d ON d.organization_id=r.organization_id AND d.contractor_id=$2 AND d.document_type_id=r.document_type_id AND d.is_current=TRUE AND d.scan_status='clean'
      WHERE r.organization_id=$1 AND r.is_active=TRUE ORDER BY dt.name`,
      [req.user.organizationId, req.params.contractorId],
    );
    const compliance = await refreshContractorSnapshot(
      req.user.organizationId,
      req.params.contractorId,
    );
    return res.json({ items: result.rows, compliance });
  } catch (error) {
    next(error);
  }
}

export async function getDocumentDownloadUrl(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT id,storage_key,file_name,scan_status FROM documents WHERE organization_id=$1 AND id=$2`,
      [req.user.organizationId, req.params.id],
    );
    if (!rows.length)
      return res.status(404).json({ message: "Document not found" });
    if (rows[0].scan_status !== "clean" || !rows[0].storage_key)
      return res
        .status(423)
        .json({ message: "Document is not available for download." });
    const { createSignedDownloadUrl } =
      await import("../services/storageService.js");
    const url = await createSignedDownloadUrl(rows[0].storage_key);
    await recordAudit({
      organizationId: req.user.organizationId,
      actorUserId: req.user.id,
      action: "document.download_url_created",
      entityType: "document",
      entityId: rows[0].id,
      req,
    });
    return res.json({ url, fileName: rows[0].file_name, expiresInSeconds: 60 });
  } catch (error) {
    next(error);
  }
}
