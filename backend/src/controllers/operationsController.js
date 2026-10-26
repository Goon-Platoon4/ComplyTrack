import { query, pool } from "../db.js";
import { recordAudit } from "../services/auditService.js";
import { refreshContractorSnapshot } from "../services/complianceService.js";
import { toCsv } from "../utils/csv.js";
import { createTextPdf } from "../services/pdfService.js";

export async function getAuditLogs(req, res, next) {
  try {
    const values = [req.user.organizationId];
    const where = ["a.organization_id=$1"];
    if (req.query.action) {
      values.push(String(req.query.action).slice(0, 100));
      where.push(`a.action=$${values.length}`);
    }
    if (req.query.search) {
      values.push(`%${String(req.query.search).slice(0, 120)}%`);
      where.push(
        `(a.action ILIKE $${values.length} OR a.entity_type ILIKE $${values.length} OR COALESCE(a.entity_id,'') ILIKE $${values.length} OR COALESCE(u.full_name,'') ILIKE $${values.length} OR COALESCE(u.email,'') ILIKE $${values.length})`,
      );
    }
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 50, 1),
      100,
    );
    values.push(limit);
    const { rows } = await query(
      `SELECT a.id,a.action,a.entity_type AS "entityType",a.entity_id AS "entityId",a.metadata,a.created_at AS "createdAt",u.full_name AS "actorName",u.email AS "actorEmail"
      FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_user_id WHERE ${where.join(" AND ")} ORDER BY a.created_at DESC LIMIT $${values.length}`,
      values,
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

async function getAuditExportRows(req, maxRows = 2000) {
  const values = [req.user.organizationId];
  const where = ["a.organization_id = $1"];

  if (req.query.action) {
    values.push(String(req.query.action).slice(0, 100));
    where.push(`a.action = $${values.length}`);
  }

  if (req.query.search) {
    values.push(`%${String(req.query.search).slice(0, 120)}%`);
    const searchParam = `$${values.length}`;

    where.push(`(
      a.action ILIKE ${searchParam}
      OR a.entity_type ILIKE ${searchParam}
      OR COALESCE(a.entity_id, '') ILIKE ${searchParam}
      OR COALESCE(u.full_name, '') ILIKE ${searchParam}
      OR COALESCE(u.email, '') ILIKE ${searchParam}
    )`);
  }

  const { rows } = await query(
    `SELECT
       a.id,
       a.action,
       a.entity_type,
       a.entity_id,
       a.metadata,
       a.created_at,
       u.full_name AS actor_name,
       u.email AS actor_email
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.actor_user_id
     WHERE ${where.join(" AND ")}
     ORDER BY a.created_at DESC
     LIMIT $${values.length + 1}`,
    [...values, maxRows],
  );

  return rows;
}

export async function exportAuditCsv(req, res, next) {
  try {
    const rows = await getAuditExportRows(req, 2000);

    const csv = toCsv(
      [
        "Timestamp",
        "Actor",
        "Email",
        "Action",
        "Entity Type",
        "Entity ID",
        "Metadata",
      ],
      rows.map((row) => [
        row.created_at?.toISOString?.() ?? row.created_at,
        row.actor_name ?? "System",
        row.actor_email ?? "",
        row.action,
        row.entity_type,
        row.entity_id ?? "",
        JSON.stringify(row.metadata ?? {}),
      ]),
    );

    await recordAudit({
      organizationId: req.user.organizationId,
      actorUserId: req.user.id,
      action: "audit_log.exported",
      entityType: "audit_log",
      metadata: { format: "csv", rows: rows.length },
      req,
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="complytrack-audit-${new Date().toISOString().slice(0, 10)}.csv"`,
    );

    return res.send(`\uFEFF${csv}`);
  } catch (error) {
    return next(error);
  }
}

async function buildAlerts(organizationId) {
  const contractors = await query(
    "SELECT id,name FROM contractors WHERE organization_id=$1 ORDER BY name",
    [organizationId],
  );
  const current = [];
  for (const contractor of contractors.rows) {
    const compliance = await refreshContractorSnapshot(
      organizationId,
      contractor.id,
    );
    for (const issue of compliance?.issues || []) {
      if (issue.status === "Compliant") continue;
      current.push({
        contractorId: contractor.id,
        ruleId: issue.ruleId,
        status: issue.status,
        expiryDate: issue.expiryDate || null,
        signature: `${contractor.id}:${issue.ruleId}:${issue.status}:${issue.expiryDate || "none"}`,
      });
    }
  }
  const signatures = current.map((item) => item.signature);
  // Upsert current issues, then resolve absent ones. A later recurrence gets a fresh alert UUID,
  // so an old per-user dismissal cannot hide a newly recurring compliance problem.
  for (const item of current) {
    await query(
      `INSERT INTO compliance_alerts (organization_id,issue_signature,contractor_id,rule_id,status,expiry_date)
      VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (organization_id,issue_signature) WHERE resolved_at IS NULL
      DO UPDATE SET status=EXCLUDED.status,expiry_date=EXCLUDED.expiry_date RETURNING id`,
      [
        organizationId,
        item.signature,
        item.contractorId,
        item.ruleId,
        item.status,
        item.expiryDate,
      ],
    );
  }
  if (signatures.length) {
    await query(
      `UPDATE compliance_alerts SET resolved_at=NOW() WHERE organization_id=$1 AND resolved_at IS NULL AND NOT (issue_signature = ANY($2::text[]))`,
      [organizationId, signatures],
    );
  } else {
    await query(
      "UPDATE compliance_alerts SET resolved_at=NOW() WHERE organization_id=$1 AND resolved_at IS NULL",
      [organizationId],
    );
  }
  const { rows } = await query(
    `SELECT a.id::text AS key,a.contractor_id AS "contractorId",c.name AS "contractorName",dt.name AS "documentType",a.status,a.expiry_date AS "expiryDate",a.opened_at AS "openedAt"
    FROM compliance_alerts a JOIN contractors c ON c.id=a.contractor_id JOIN compliance_rules r ON r.id=a.rule_id JOIN document_types dt ON dt.id=r.document_type_id
    WHERE a.organization_id=$1 AND a.resolved_at IS NULL ORDER BY CASE a.status WHEN 'Expired' THEN 1 WHEN 'Missing' THEN 2 ELSE 3 END,a.opened_at DESC`,
    [organizationId],
  );
  return rows.map((alert) => ({
    ...alert,
    message:
      alert.status === "Missing"
        ? `${alert.documentType} is required but missing.`
        : alert.status === "Expired"
          ? `${alert.documentType} has expired.`
          : `${alert.documentType} is expiring soon.`,
  }));
}

export async function getAlerts(req, res, next) {
  try {
    const [alerts, states] = await Promise.all([
      buildAlerts(req.user.organizationId),
      query(
        "SELECT alert_key,read_at,dismissed_at FROM user_alert_states WHERE organization_id=$1 AND user_id=$2",
        [req.user.organizationId, req.user.id],
      ),
    ]);
    const stateMap = new Map(states.rows.map((s) => [s.alert_key, s]));
    const items = alerts
      .map((alert) => ({
        ...alert,
        readAt: stateMap.get(alert.key)?.read_at || null,
        dismissedAt: stateMap.get(alert.key)?.dismissed_at || null,
      }))
      .filter((a) => !a.dismissedAt);
    res.json({ items, unreadCount: items.filter((a) => !a.readAt).length });
  } catch (error) {
    next(error);
  }
}

export async function updateAlertState(req, res, next) {
  try {
    const { alertKey, action } = req.body || {};
    if (
      typeof alertKey !== "string" ||
      alertKey.length > 500 ||
      !["read", "dismiss"].includes(action)
    )
      return res.status(400).json({
        message: "A valid alert key and read/dismiss action are required.",
      });
    const current = await buildAlerts(req.user.organizationId);
    if (!current.some((alert) => alert.key === alertKey))
      return res.status(404).json({ message: "Alert no longer exists." });
    const column = action === "read" ? "read_at" : "dismissed_at";
    await query(
      `INSERT INTO user_alert_states (organization_id,user_id,alert_key,${column}) VALUES ($1,$2,$3,NOW()) ON CONFLICT (organization_id,user_id,alert_key) DO UPDATE SET ${column}=NOW(),updated_at=NOW()`,
      [req.user.organizationId, req.user.id, alertKey],
    );
    return res.json({
      message:
        action === "read"
          ? "Alert marked as read."
          : "Alert dismissed for your account.",
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrganizationSettings(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT o.id,o.name,o.registration_no AS "registrationNo",o.contact_email AS "contactEmail",o.contact_phone AS "contactPhone",o.timezone,o.date_format AS "dateFormat",o.status,s.settings
      FROM organizations o LEFT JOIN organization_settings s ON s.organization_id=o.id WHERE o.id=$1`,
      [req.user.organizationId],
    );
    if (!rows.length)
      return res.status(404).json({ message: "Organization not found." });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

export async function updateOrganizationSettings(req, res, next) {
  if (req.user.role !== "Administrator")
    return res.status(403).json({
      message: "Only an Administrator can change organization settings.",
    });
  const {
    name,
    registrationNo,
    contactEmail,
    contactPhone,
    timezone,
    dateFormat,
    settings,
  } = req.body || {};
  if (
    name !== undefined &&
    (typeof name !== "string" || !name.trim() || name.length > 180)
  )
    return res.status(400).json({ message: "Organization name is required." });
  if (contactEmail && !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(contactEmail))
    return res.status(400).json({ message: "Contact email is invalid." });
  if (timezone !== undefined) {
    try {
      if (typeof timezone !== "string" || timezone.length > 80)
        throw new Error("invalid");
      new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    } catch {
      return res
        .status(400)
        .json({ message: "Timezone must be a valid IANA timezone." });
    }
  }
  if (
    dateFormat !== undefined &&
    !["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"].includes(dateFormat)
  )
    return res.status(400).json({ message: "Date format is not supported." });
  if (
    settings !== undefined &&
    (!settings || typeof settings !== "object" || Array.isArray(settings))
  )
    return res.status(400).json({ message: "Settings must be an object." });
  if (
    settings?.sessionTimeoutMinutes !== undefined &&
    ![15, 30, 60].includes(settings.sessionTimeoutMinutes)
  )
    return res
      .status(400)
      .json({ message: "Session timeout must be 15, 30, or 60 minutes." });
  if (
    settings?.reminderMode !== undefined &&
    settings.reminderMode !== "in_app"
  )
    return res.status(400).json({
      message:
        "Only in-app compliance reminders are supported in this release.",
    });
  if (
    settings &&
    Object.keys(settings).some(
      (key) =>
        ![
          "sessionTimeoutMinutes",
          "reminderMode",
          "dateFormat",
          "preferredExportFormat",
          "notificationDisplay",
        ].includes(key),
    )
  )
    return res.status(400).json({
      message: "One or more unsupported organization settings were supplied.",
    });
  try {
    const { rows } = await query(
      `UPDATE organizations SET name=COALESCE($1,name),registration_no=COALESCE($2,registration_no),contact_email=COALESCE($3,contact_email),contact_phone=COALESCE($4,contact_phone),timezone=COALESCE($5,timezone),date_format=COALESCE($6,date_format),updated_at=NOW() WHERE id=$7 RETURNING id,name,registration_no AS "registrationNo",contact_email AS "contactEmail",contact_phone AS "contactPhone",timezone,date_format AS "dateFormat"`,
      [
        name?.trim() ?? null,
        registrationNo ?? null,
        contactEmail?.trim().toLowerCase() ?? null,
        contactPhone ?? null,
        timezone ?? null,
        dateFormat ?? null,
        req.user.organizationId,
      ],
    );
    if (settings !== undefined)
      await query(
        `INSERT INTO organization_settings (organization_id,settings,updated_by,updated_at) VALUES ($1,$2::jsonb,$3,NOW()) ON CONFLICT (organization_id) DO UPDATE SET settings=EXCLUDED.settings,updated_by=EXCLUDED.updated_by,updated_at=NOW()`,
        [req.user.organizationId, JSON.stringify(settings), req.user.id],
      );
    await recordAudit({
      organizationId: req.user.organizationId,
      actorUserId: req.user.id,
      action: "organization.settings_updated",
      entityType: "organization",
      entityId: req.user.organizationId,
      metadata: { changedFields: Object.keys(req.body || {}) },
      req,
    });
    return res.json(rows[0]);
  } catch (error) {
    next(error);
  }
}

export async function listMembers(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT u.id,u.full_name AS "fullName",u.email,m.role,m.status,m.created_at AS "joinedAt",u.email_verified_at IS NOT NULL AS "emailVerified",u.mfa_enabled AS "mfaEnabled"
      FROM organization_memberships m JOIN users u ON u.id=m.user_id WHERE m.organization_id=$1 ORDER BY m.created_at`,
      [req.user.organizationId],
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

export async function createInvitation(req, res, next) {
  if (req.user.role !== "Administrator")
    return res
      .status(403)
      .json({ message: "Only an Administrator can invite members." });
  const email =
    typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  const role = req.body?.role;
  if (
    !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email) ||
    !["Compliance Officer", "Read-only Auditor"].includes(role)
  )
    return res
      .status(400)
      .json({ message: "A valid email and permitted role are required." });
  if (
    process.env.NODE_ENV === "production" &&
    (!process.env.EMAIL_API_URL ||
      !process.env.EMAIL_API_KEY ||
      !process.env.EMAIL_FROM)
  )
    return res.status(503).json({
      message:
        "Invitations are temporarily unavailable because transactional email is not configured.",
    });
  try {
    const { createOpaqueToken, hashToken } = await import("../utils/crypto.js");
    const token = createOpaqueToken();
    const { rows } = await query(
      `INSERT INTO organization_invitations (organization_id,email,role,token_hash,invited_by,expires_at) VALUES ($1,$2,$3,$4,$5,NOW()+INTERVAL '7 days') RETURNING id,organization_id,email,role,expires_at`,
      [req.user.organizationId, email, role, hashToken(token), req.user.id],
    );
    await recordAudit({
      organizationId: req.user.organizationId,
      actorUserId: req.user.id,
      action: "organization.invitation_created",
      entityType: "invitation",
      entityId: rows[0].id,
      metadata: { email, role },
      req,
    });
    const inviteUrl = `${process.env.APP_BASE_URL || "http://localhost:5173"}/signup?invitationToken=${encodeURIComponent(token)}`;
    let deliveryStatus = "failed";
    try {
      const { sendTransactionalEmail } =
        await import("../services/emailService.js");
      const delivery = await sendTransactionalEmail({
        to: email,
        subject: "You are invited to ComplyTrack",
        text: `You have been invited to join ComplyTrack as ${role}. Accept within 7 days: ${inviteUrl}`,
      });
      deliveryStatus = delivery.delivered ? "sent" : "not_configured";
    } catch (mailError) {
      console.error("Invitation email delivery failed:", mailError.message);
    }
    const response = {
      ...rows[0],
      deliveryStatus,
      message:
        deliveryStatus === "sent"
          ? "Invitation created and email sent. It expires in 7 days."
          : "Invitation created, but email delivery is not confirmed. Configure email delivery or use the development token.",
    };
    if (process.env.NODE_ENV !== "production" && deliveryStatus !== "sent")
      response.developmentInvitationToken = token;
    return res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

export async function changeMemberRole(req, res, next) {
  if (req.user.role !== "Administrator")
    return res
      .status(403)
      .json({ message: "Only an Administrator can change member roles." });
  const role = req.body?.role;
  if (
    !["Administrator", "Compliance Officer", "Read-only Auditor"].includes(role)
  )
    return res.status(400).json({ message: "Role is invalid." });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT id FROM organizations WHERE id=$1 FOR UPDATE", [
      req.user.organizationId,
    ]);
    const target = await client.query(
      "SELECT role,status FROM organization_memberships WHERE organization_id=$1 AND user_id=$2 FOR UPDATE",
      [req.user.organizationId, req.params.userId],
    );
    if (!target.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Member not found." });
    }
    if (
      target.rows[0].role === "Administrator" &&
      target.rows[0].status === "active" &&
      role !== "Administrator"
    ) {
      const count = await client.query(
        `SELECT COUNT(*)::int AS count FROM organization_memberships WHERE organization_id=$1 AND role='Administrator' AND status='active'`,
        [req.user.organizationId],
      );
      if (count.rows[0].count <= 1) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          message: "The last active Administrator cannot be demoted.",
        });
      }
    }
    const { rows } = await client.query(
      `UPDATE organization_memberships SET role=$1,updated_at=NOW() WHERE organization_id=$2 AND user_id=$3 RETURNING user_id,role,status`,
      [role, req.user.organizationId, req.params.userId],
    );
    await client.query(
      `INSERT INTO audit_logs (organization_id,actor_user_id,action,entity_type,entity_id,metadata,ip_address,user_agent) VALUES ($1,$2,'organization.member_role_changed','user',$3,$4::jsonb,$5,$6)`,
      [
        req.user.organizationId,
        req.user.id,
        req.params.userId,
        JSON.stringify({ role }),
        req.ip || null,
        req.get("user-agent")?.slice(0, 500) || null,
      ],
    );
    await client.query("COMMIT");
    return res.json(rows[0]);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    return next(error);
  } finally {
    client.release();
  }
}

export async function updateMemberStatus(req, res, next) {
  if (req.user.role !== "Administrator")
    return res
      .status(403)
      .json({ message: "Only an Administrator can change member access." });
  const status = req.body?.status;
  if (!["active", "deactivated"].includes(status))
    return res
      .status(400)
      .json({ message: "Status must be active or deactivated." });
  if (req.params.userId === req.user.id && status === "deactivated")
    return res
      .status(409)
      .json({ message: "You cannot deactivate your own membership." });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT id FROM organizations WHERE id=$1 FOR UPDATE", [
      req.user.organizationId,
    ]);
    const target = await client.query(
      "SELECT role,status FROM organization_memberships WHERE organization_id=$1 AND user_id=$2 FOR UPDATE",
      [req.user.organizationId, req.params.userId],
    );
    if (!target.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Member not found." });
    }
    if (
      target.rows[0].role === "Administrator" &&
      target.rows[0].status === "active" &&
      status === "deactivated"
    ) {
      const count = await client.query(
        `SELECT COUNT(*)::int AS count FROM organization_memberships WHERE organization_id=$1 AND role='Administrator' AND status='active'`,
        [req.user.organizationId],
      );
      if (count.rows[0].count <= 1) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          message: "The last active Administrator cannot be deactivated.",
        });
      }
    }
    const { rows } = await client.query(
      "UPDATE organization_memberships SET status=$1,updated_at=NOW() WHERE organization_id=$2 AND user_id=$3 RETURNING user_id,status,role",
      [status, req.user.organizationId, req.params.userId],
    );
    if (status === "deactivated")
      await client.query(
        "UPDATE auth_sessions SET revoked_at=NOW() WHERE user_id=$1 AND organization_id=$2 AND revoked_at IS NULL",
        [req.params.userId, req.user.organizationId],
      );
    await client.query(
      `INSERT INTO audit_logs (organization_id,actor_user_id,action,entity_type,entity_id,metadata,ip_address,user_agent) VALUES ($1,$2,$3,'user',$4,$5::jsonb,$6,$7)`,
      [
        req.user.organizationId,
        req.user.id,
        status === "active"
          ? "organization.member_reactivated"
          : "organization.member_deactivated",
        req.params.userId,
        JSON.stringify({ status }),
        req.ip || null,
        req.get("user-agent")?.slice(0, 500) || null,
      ],
    );
    await client.query("COMMIT");
    return res.json(rows[0]);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    return next(error);
  } finally {
    client.release();
  }
}

export async function archiveOrganization(req, res, next) {
  if (req.user.role !== "Administrator")
    return res
      .status(403)
      .json({ message: "Only an Administrator can archive the organization." });
  if (
    typeof req.body?.confirmName !== "string" ||
    !req.body.confirmName.trim() ||
    req.body.confirmName !== req.body.confirmName.trim()
  )
    return res.status(400).json({
      message: "Enter the exact organization name to confirm archiving.",
    });
  try {
    const { rows } = await query(
      `UPDATE organizations SET status='archived',archived_at=NOW(),updated_at=NOW() WHERE id=$1 AND name=$2 AND status='active' RETURNING id,name,status,archived_at`,
      [req.user.organizationId, req.body.confirmName.trim()],
    );
    if (!rows.length)
      return res.status(409).json({
        message:
          "Organization was not archived. Confirm the exact name and check its current status.",
      });
    await query(
      "UPDATE auth_sessions SET revoked_at=NOW() WHERE organization_id=$1 AND revoked_at IS NULL",
      [req.user.organizationId],
    );
    await recordAudit({
      organizationId: req.user.organizationId,
      actorUserId: req.user.id,
      action: "organization.archived",
      entityType: "organization",
      entityId: req.user.organizationId,
      req,
    });
    return res.json({
      message:
        "Organization archived. Data and document records have been retained.",
      organization: rows[0],
    });
  } catch (error) {
    next(error);
  }
}

export async function exportAuditPdf(req, res, next) {
  try {
    const rows = await getAuditExportRows(req, 2000);
    const orgResult = await query(
      "SELECT name FROM organizations WHERE id=$1",
      [req.user.organizationId],
    );
    const lines = [
      `Organization: ${orgResult.rows[0]?.name || req.user.organizationId}`,
      `Organization ID: ${req.user.organizationId}`,
      `Entries included: ${rows.length} (maximum 2,000)`,
      "",
      "TIMESTAMP | ACTOR | ACTION | ENTITY | DETAILS",
      ...rows.map(
        (r) =>
          `${r.created_at?.toISOString?.() || r.created_at} | ${r.actor_name || "System"} | ${r.action} | ${r.entity_type}:${r.entity_id || "-"} | ${JSON.stringify(r.metadata || {})}`,
      ),
    ];
    const pdf = createTextPdf("ComplyTrack Audit Log Export", lines);
    await recordAudit({
      organizationId: req.user.organizationId,
      actorUserId: req.user.id,
      action: "audit_log.exported",
      entityType: "audit_log",
      metadata: { format: "pdf", rows: rows.length },
      req,
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="complytrack-audit-${new Date().toISOString().slice(0, 10)}.pdf"`,
    );
    return res.send(pdf);
  } catch (error) {
    next(error);
  }
}
