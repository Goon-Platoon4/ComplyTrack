import { createHash, randomUUID } from "node:crypto";
import { pool, query } from "../db.js";
import {
  uploadQuarantineObject,
  moveQuarantineObject,
  removeStorageObject,
} from "../services/storageService.js";
import { scanDocument } from "../services/malwareScanner.js";
import { refreshContractorSnapshot } from "../services/complianceService.js";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Map([
  ["pdf", "application/pdf"],
  ["jpg", "image/jpeg"],
  ["png", "image/png"],
]);
function detectFileType(buffer) {
  if (buffer.subarray(0, 5).toString() === "%PDF-")
    return { ext: "pdf", mime: "application/pdf" };
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  )
    return { ext: "jpg", mime: "image/jpeg" };
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return { ext: "png", mime: "image/png" };
  return null;
}

export async function uploadDocument(req, res, next) {
  if (!["Administrator", "Compliance Officer"].includes(req.user.role))
    return res.status(403).json({ message: "Insufficient permissions" });
  const fileBuffer = Buffer.isBuffer(req.body) ? Buffer.from(req.body) : null;
  if (!fileBuffer?.length)
    return res
      .status(400)
      .json({ message: "Send the file as application/octet-stream." });
  if (fileBuffer.length > MAX_BYTES)
    return res.status(413).json({ message: "Files must be 10 MB or smaller." });
  const contractorId = Number(req.query.contractorId);
  const documentTypeId = Number(req.query.documentTypeId);
  if (
    !Number.isSafeInteger(contractorId) ||
    !Number.isSafeInteger(documentTypeId)
  )
    return res
      .status(400)
      .json({ message: "Contractor and document type are required." });
  const client = await pool.connect();
  let quarantineKey;
  let publishedKey;
  let committed = false;
  try {
    const [contractor, rule, detected] = await Promise.all([
      query("SELECT id FROM contractors WHERE organization_id=$1 AND id=$2", [
        req.user.organizationId,
        contractorId,
      ]),
      query(
        "SELECT expiry_tracked,is_active FROM compliance_rules WHERE organization_id=$1 AND document_type_id=$2",
        [req.user.organizationId, documentTypeId],
      ),
      Promise.resolve(detectFileType(fileBuffer)),
    ]);
    if (!contractor.rowCount)
      return res.status(404).json({ message: "Contractor not found" });
    if (!rule.rowCount || !rule.rows[0].is_active)
      return res
        .status(400)
        .json({
          message:
            "This document type is not an active rule for your organization.",
        });
    if (
      !detected ||
      !ALLOWED.has(detected.ext) ||
      ALLOWED.get(detected.ext) !== detected.mime
    )
      return res
        .status(415)
        .json({ message: "File content must be a valid PDF, JPEG, or PNG." });
    const {
      referenceNo = null,
      issueDate = null,
      expiryDate = null,
      notes = "",
      fileName = "document",
    } = req.query;
    if (issueDate && !/^\d{4}-\d{2}-\d{2}$/.test(issueDate))
      return res
        .status(400)
        .json({ message: "Issue date must use YYYY-MM-DD." });
    if (
      rule.rows[0].expiry_tracked &&
      (!expiryDate || !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate))
    )
      return res
        .status(400)
        .json({
          message: "An expiry date is required for this document type.",
        });
    if (
      !rule.rows[0].expiry_tracked &&
      expiryDate &&
      !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)
    )
      return res
        .status(400)
        .json({ message: "Expiry date must use YYYY-MM-DD." });
    if (issueDate && expiryDate && expiryDate < issueDate)
      return res
        .status(400)
        .json({ message: "Expiry date cannot be before issue date." });
    const checksum = createHash("sha256").update(fileBuffer).digest("hex");
    const objectId = randomUUID();
    quarantineKey = `${req.user.organizationId}/quarantine/${objectId}`;
    await uploadQuarantineObject(quarantineKey, fileBuffer, detected.mime);
    const scan = await scanDocument({
      buffer: fileBuffer,
      contentType: detected.mime,
      checksum,
    });
    if (scan.status !== "clean") {
  try {
    await removeStorageObject(quarantineKey);
    quarantineKey = null;
  } catch (cleanupError) {
    console.error(
      "Failed to remove blocked document from quarantine:",
      cleanupError.message
    );
  }
      await query(
        `INSERT INTO audit_logs (organization_id,actor_user_id,action,entity_type,metadata,ip_address,user_agent) VALUES ($1,$2,'document.scan_blocked','document',$3::jsonb,$4,$5)`,
        [
          req.user.organizationId,
          req.user.id,
          JSON.stringify({
            contractorId,
            documentTypeId,
            scanStatus: scan.status,
            scanner: scan.provider,
            detailCode: scan.detailCode || null,
          }),
          req.ip || null,
          req.get("user-agent")?.slice(0, 500) || null,
        ],
      );
      return res
        .status(503)
        .json({
          message:
            "The file was not published because malware scanning did not confirm it was clean. Try again later.",
          scanStatus: scan.status,
        });
    }
    publishedKey = `${req.user.organizationId}/documents/${contractorId}/${documentTypeId}/${objectId}`;
    await moveQuarantineObject(quarantineKey, publishedKey);
    quarantineKey = null;
    await client.query("BEGIN");
    await client.query(
      "SELECT id FROM contractors WHERE organization_id=$1 AND id=$2 FOR UPDATE",
      [req.user.organizationId, contractorId],
    );
    const current = await client.query(
      "SELECT COALESCE(MAX(version_number),0) AS version FROM documents WHERE organization_id=$1 AND contractor_id=$2 AND document_type_id=$3",
      [req.user.organizationId, contractorId, documentTypeId],
    );
    const version = Number(current.rows[0].version) + 1;
    await client.query(
      "UPDATE documents SET is_current=FALSE,updated_at=NOW() WHERE organization_id=$1 AND contractor_id=$2 AND document_type_id=$3 AND is_current=TRUE",
      [req.user.organizationId, contractorId, documentTypeId],
    );
    const inserted = await client.query(
      `INSERT INTO documents (organization_id,contractor_id,document_type_id,reference_no,issue_date,expiry_date,file_name,storage_key,notes,uploaded_by,version_number,is_current,scan_status,scanned_at,mime_type,file_size_bytes,checksum_sha256,uploaded_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,TRUE,'clean',NOW(),$12,$13,$14,NOW())
      RETURNING id,contractor_id AS "contractorId",document_type_id AS "documentTypeId",version_number AS "versionNumber",file_name AS "fileName",expiry_date AS "expiryDate",scan_status AS "scanStatus",uploaded_at AS "uploadedAt"`,
      [
        req.user.organizationId,
        contractorId,
        documentTypeId,
        referenceNo || null,
        issueDate || null,
        expiryDate || null,
        String(fileName).slice(0, 255),
        publishedKey,
        String(notes).slice(0, 2000) || null,
        req.user.id,
        version,
        detected.mime,
        fileBuffer.length,
        checksum,
      ],
    );
    await client.query(
      `INSERT INTO document_scan_events (organization_id,document_id,scanner,result) VALUES ($1,$2,$3,'clean')`,
      [req.user.organizationId, inserted.rows[0].id, scan.provider],
    );
    await client.query(
      `INSERT INTO audit_logs (organization_id,actor_user_id,action,entity_type,entity_id,metadata,ip_address,user_agent) VALUES ($1,$2,'document.uploaded','document',$3,$4::jsonb,$5,$6)`,
      [
        req.user.organizationId,
        req.user.id,
        inserted.rows[0].id,
        JSON.stringify({
          contractorId,
          documentTypeId,
          version,
          sizeBytes: fileBuffer.length,
          mimeType: detected.mime,
          checksum,
        }),
        req.ip || null,
        req.get("user-agent")?.slice(0, 500) || null,
      ],
    );
    await client.query("COMMIT");
    committed = true;
    try {
      await refreshContractorSnapshot(req.user.organizationId, contractorId);
    } catch (refreshError) {
      console.error(
        "Compliance snapshot refresh failed after upload commit:",
        refreshError.message,
      );
    }
    return res.status(201).json(inserted.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    if (publishedKey && !committed)
      await removeStorageObject(publishedKey).catch(() => {});
    if (quarantineKey) await removeStorageObject(quarantineKey).catch(() => {});
    return next(error);
  } finally {
    client.release();
  }
}
