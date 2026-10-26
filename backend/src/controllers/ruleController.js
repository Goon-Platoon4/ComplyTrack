import { query } from "../db.js";
import { recordAudit } from "../services/auditService.js";
import { refreshContractorSnapshot } from "../services/complianceService.js";

const adminOnly = (req, res) =>
  req.user.role === "Administrator"
    ? true
    : (res
        .status(403)
        .json({
          message: "Only an Administrator can manage compliance rules.",
        }),
      false);
export async function listRules(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT r.id,r.document_type_id AS "documentTypeId",dt.name AS "documentType",r.category,r.is_required AS required,
      r.required_for_site_work AS "requiredForSiteWork",r.expiry_tracked AS "expiryTracked",r.reminder_days AS "reminderDays",r.is_active AS active,r.updated_at AS "updatedAt"
      FROM compliance_rules r JOIN document_types dt ON dt.id=r.document_type_id WHERE r.organization_id=$1 ORDER BY dt.name`,
      [req.user.organizationId],
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

export async function updateRule(req, res, next) {
  if (!adminOnly(req, res)) return;
  const {
    category,
    required,
    requiredForSiteWork,
    expiryTracked,
    reminderDays,
    active,
  } = req.body || {};
  if (
    category !== undefined &&
    (typeof category !== "string" || !category.trim() || category.length > 100)
  )
    return res
      .status(400)
      .json({ message: "Category must be 1–100 characters." });
  for (const [key, value] of Object.entries({
    required,
    requiredForSiteWork,
    expiryTracked,
    active,
  }))
    if (value !== undefined && typeof value !== "boolean")
      return res.status(400).json({ message: `${key} must be a boolean.` });
  if (
    reminderDays !== undefined &&
    (!Number.isInteger(reminderDays) || reminderDays < 0 || reminderDays > 365)
  )
    return res
      .status(400)
      .json({ message: "Reminder days must be between 0 and 365." });
  try {
    const { rows } = await query(
      `UPDATE compliance_rules SET category=COALESCE($1,category),is_required=COALESCE($2,is_required),required_for_site_work=COALESCE($3,required_for_site_work),
      expiry_tracked=COALESCE($4,expiry_tracked),reminder_days=COALESCE($5,reminder_days),is_active=COALESCE($6,is_active),updated_by=$7,updated_at=NOW()
      WHERE organization_id=$8 AND id=$9 RETURNING *`,
      [
        category?.trim() ?? null,
        required ?? null,
        requiredForSiteWork ?? null,
        expiryTracked ?? null,
        reminderDays ?? null,
        active ?? null,
        req.user.id,
        req.user.organizationId,
        req.params.id,
      ],
    );
    if (!rows.length)
      return res.status(404).json({ message: "Compliance rule not found." });
    await recordAudit({
      organizationId: req.user.organizationId,
      actorUserId: req.user.id,
      action: "compliance_rule.updated",
      entityType: "compliance_rule",
      entityId: req.params.id,
      metadata: { changedFields: Object.keys(req.body || {}) },
      req,
    });
    const contractors = await query(
      "SELECT id FROM contractors WHERE organization_id=$1",
      [req.user.organizationId],
    );
    for (const contractor of contractors.rows)
      await refreshContractorSnapshot(req.user.organizationId, contractor.id);
    return res.json({
      id: rows[0].id,
      category: rows[0].category,
      required: rows[0].is_required,
      requiredForSiteWork: rows[0].required_for_site_work,
      expiryTracked: rows[0].expiry_tracked,
      reminderDays: rows[0].reminder_days,
      active: rows[0].is_active,
    });
  } catch (error) {
    next(error);
  }
}

export async function createRule(req, res, next) {
  if (!adminOnly(req, res)) return;
  const {
    documentTypeName,
    description = "",
    category = "Other",
    required = true,
    requiredForSiteWork = false,
    expiryTracked = true,
    reminderDays = 30,
  } = req.body || {};
  if (
    typeof documentTypeName !== "string" ||
    !documentTypeName.trim() ||
    documentTypeName.length > 150
  )
    return res.status(400).json({ message: "Document type name is required." });
  if (
    ![required, requiredForSiteWork, expiryTracked].every(
      (v) => typeof v === "boolean",
    ) ||
    !Number.isInteger(reminderDays) ||
    reminderDays < 0 ||
    reminderDays > 365
  )
    return res.status(400).json({ message: "Rule options are invalid." });
  const client = await (await import("../db.js")).pool.connect();
  try {
    await client.query("BEGIN");
    const type = await client.query(
      `INSERT INTO document_types (name,description,required_for_site_work) VALUES ($1,$2,$3) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id`,
      [
        documentTypeName.trim(),
        String(description).slice(0, 1000),
        requiredForSiteWork,
      ],
    );
    const { rows } = await client.query(
      `INSERT INTO compliance_rules (organization_id,document_type_id,category,is_required,required_for_site_work,expiry_tracked,reminder_days,created_by,updated_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8) RETURNING id`,
      [
        req.user.organizationId,
        type.rows[0].id,
        String(category).slice(0, 100),
        required,
        requiredForSiteWork,
        expiryTracked,
        reminderDays,
        req.user.id,
      ],
    );
    await client.query("COMMIT");
    await recordAudit({
      organizationId: req.user.organizationId,
      actorUserId: req.user.id,
      action: "compliance_rule.created",
      entityType: "compliance_rule",
      entityId: rows[0].id,
      req,
    });
    return res
      .status(201)
      .json({
        id: rows[0].id,
        documentTypeId: type.rows[0].id,
        documentType: documentTypeName.trim(),
      });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    if (error.code === "23505")
      return res
        .status(409)
        .json({
          message:
            "This document type already has a rule in your organization.",
        });
    return next(error);
  } finally {
    client.release();
  }
}
