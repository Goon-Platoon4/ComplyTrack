import { query, pool } from "../db.js";
import { refreshContractorSnapshot } from "../services/complianceService.js";
import { recordAudit } from "../services/auditService.js";

const rolesWrite = ["Administrator", "Compliance Officer"];
const validStatus = ["Compliant", "Expiring soon", "Expired", "Missing"];
const isIsoDate = (value) =>
  value == null ||
  value === "" ||
  (typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value);
const baseSelect = `SELECT id, name, registration_no AS registration, category, contact_name AS contact,
 contact_email AS email, contact_phone AS phone, works_on_site AS "worksOnSite", status,
 next_expiry AS "nextExpiry", contract_start AS "contractStart", contract_end AS "contractEnd"
 FROM contractors`;

export async function getContractors(req, res, next) {
  try {
    const values = [req.user.organizationId];
    const where = ["organization_id = $1"];
    const { search, status, category } = req.query;
    if (search) {
      values.push(`%${String(search).slice(0, 150)}%`);
      where.push(
        `(name ILIKE $${values.length} OR registration_no ILIKE $${values.length} OR contact_name ILIKE $${values.length} OR COALESCE(contact_email,'') ILIKE $${values.length})`,
      );
    }
    if (category) {
      values.push(String(category).slice(0, 100));
      where.push(`category = $${values.length}`);
    }
    const result = await query(
      `${baseSelect} WHERE ${where.join(" AND ")} ORDER BY name ASC`,
      values,
    );
    const items = [];
    for (const contractor of result.rows) {
      const compliance = await refreshContractorSnapshot(
        req.user.organizationId,
        contractor.id,
      );
      const item = {
        ...contractor,
        ...(compliance
          ? { status: compliance.status, nextExpiry: compliance.nextExpiry }
          : {}),
      };
      if (!status || item.status === status) items.push(item);
    }
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 50, 1),
      100,
    );
    const offset = Math.max(Number.parseInt(req.query.offset, 10) || 0, 0);
    return res.json({
      items: items.slice(offset, offset + limit),
      total: items.length,
      limit,
      offset,
    });
  } catch (error) {
    next(error);
  }
}

export async function getContractorById(req, res, next) {
  try {
    const result = await query(
      `${baseSelect} WHERE organization_id=$1 AND id=$2`,
      [req.user.organizationId, req.params.id],
    );
    if (!result.rows[0])
      return res.status(404).json({ message: "Contractor not found" });
    const compliance = await refreshContractorSnapshot(
      req.user.organizationId,
      req.params.id,
    );
    return res.json({
      ...result.rows[0],
      ...(compliance ? { status: compliance.status, compliance } : {}),
    });
  } catch (error) {
    next(error);
  }
}

export async function createContractor(req, res, next) {
  if (!rolesWrite.includes(req.user.role))
    return res.status(403).json({ message: "Insufficient permissions" });
  const {
    name,
    registration,
    category,
    contact,
    email,
    phone,
    worksOnSite = false,
    contractStart = null,
    contractEnd = null,
  } = req.body || {};
  if (
    ![name, registration, category, contact].every(
      (v) => typeof v === "string" && v.trim(),
    ) ||
    name.length > 180 ||
    registration.length > 80 ||
    category.length > 100 ||
    contact.length > 120
  )
    return res
      .status(400)
      .json({
        message:
          "Name, registration number, category, and contact name are required.",
      });
  if (email && !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email))
    return res.status(400).json({ message: "Contact email is invalid." });
  if (typeof worksOnSite !== "boolean")
    return res.status(400).json({ message: "worksOnSite must be a boolean." });
  if (![contractStart, contractEnd].every(isIsoDate))
    return res
      .status(400)
      .json({ message: "Contract dates must use YYYY-MM-DD." });
  if (contractStart && contractEnd && contractEnd < contractStart)
    return res
      .status(400)
      .json({ message: "Contract end cannot be before contract start." });
  try {
    const { rows } = await query(
      `INSERT INTO contractors (organization_id,name,registration_no,category,contact_name,contact_email,contact_phone,works_on_site,contract_start,contract_end)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id,name,registration_no AS registration,category,contact_name AS contact,contact_email AS email,contact_phone AS phone,works_on_site AS "worksOnSite",status,next_expiry AS "nextExpiry"`,
      [
        req.user.organizationId,
        name.trim(),
        registration.trim(),
        category.trim(),
        contact.trim(),
        email?.trim().toLowerCase() || null,
        phone?.trim() || null,
        worksOnSite,
        contractStart,
        contractEnd,
      ],
    );
    await recordAudit({
      organizationId: req.user.organizationId,
      actorUserId: req.user.id,
      action: "contractor.created",
      entityType: "contractor",
      entityId: rows[0].id,
      req,
    });
    return res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === "23505")
      return res
        .status(409)
        .json({
          message:
            "That registration number is already in use in this organization.",
        });
    return next(error);
  }
}

export async function updateContractor(req, res, next) {
  if (!rolesWrite.includes(req.user.role))
    return res.status(403).json({ message: "Insufficient permissions" });
  const allowed = {
    name: "name",
    registration: "registration_no",
    category: "category",
    contact: "contact_name",
    email: "contact_email",
    phone: "contact_phone",
    worksOnSite: "works_on_site",
    contractStart: "contract_start",
    contractEnd: "contract_end",
  };
  const entries = Object.entries(req.body || {}).filter(
    ([key]) => allowed[key],
  );
  if (!entries.length)
    return res
      .status(400)
      .json({ message: "Provide at least one supported field to update." });
  if (
    entries.some(
      ([key, value]) =>
        ["name", "registration", "category", "contact"].includes(key) &&
        (typeof value !== "string" || !value.trim()),
    )
  )
    return res
      .status(400)
      .json({ message: "Required contractor fields cannot be empty." });
  const updated = Object.fromEntries(entries);
  if (updated.email && !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(updated.email))
    return res.status(400).json({ message: "Contact email is invalid." });
  if (
    updated.worksOnSite !== undefined &&
    typeof updated.worksOnSite !== "boolean"
  )
    return res.status(400).json({ message: "worksOnSite must be a boolean." });
  if (updated.contractStart !== undefined && !isIsoDate(updated.contractStart))
    return res
      .status(400)
      .json({ message: "Contract start must use YYYY-MM-DD." });
  if (updated.contractEnd !== undefined && !isIsoDate(updated.contractEnd))
    return res
      .status(400)
      .json({ message: "Contract end must use YYYY-MM-DD." });
  if (
    updated.contractStart &&
    updated.contractEnd &&
    updated.contractEnd < updated.contractStart
  )
    return res
      .status(400)
      .json({ message: "Contract end cannot be before contract start." });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const before = await client.query(
      "SELECT * FROM contractors WHERE organization_id=$1 AND id=$2 FOR UPDATE",
      [req.user.organizationId, req.params.id],
    );
    if (!before.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Contractor not found" });
    }
    const values = entries.map(([key, value]) =>
      key === "email" && typeof value === "string"
        ? value.trim().toLowerCase()
        : typeof value === "string"
          ? value.trim() || null
          : value,
    );
    values.push(req.user.organizationId, req.params.id);
    const sets = entries.map(([key], i) => `${allowed[key]}=$${i + 1}`);
    const { rows } = await client.query(
      `UPDATE contractors SET ${sets.join(",")},updated_at=NOW() WHERE organization_id=$${values.length - 1} AND id=$${values.length} RETURNING id,name,registration_no AS registration,category,contact_name AS contact,contact_email AS email,contact_phone AS phone,works_on_site AS "worksOnSite",status,next_expiry AS "nextExpiry"`,
      values,
    );
    await client.query(
      `INSERT INTO audit_logs (organization_id,actor_user_id,action,entity_type,entity_id,metadata,ip_address,user_agent) VALUES ($1,$2,'contractor.updated','contractor',$3,$4::jsonb,$5,$6)`,
      [
        req.user.organizationId,
        req.user.id,
        req.params.id,
        JSON.stringify({ fields: entries.map(([key]) => key) }),
        req.ip || null,
        req.get("user-agent")?.slice(0, 500) || null,
      ],
    );
    await client.query("COMMIT");
    const compliance = await refreshContractorSnapshot(
      req.user.organizationId,
      req.params.id,
    );
    return res.json({
      ...rows[0],
      ...(compliance ? { status: compliance.status, compliance } : {}),
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    if (error.code === "23505")
      return res
        .status(409)
        .json({
          message:
            "That registration number is already in use in this organization.",
        });
    return next(error);
  } finally {
    client.release();
  }
}

export async function getContractorComplianceDetails(req, res, next) {
  try {
    const result = await refreshContractorSnapshot(
      req.user.organizationId,
      req.params.id,
    );
    if (!result)
      return res.status(404).json({ message: "Contractor not found" });
    return res.json(result);
  } catch (error) {
    next(error);
  }
}
