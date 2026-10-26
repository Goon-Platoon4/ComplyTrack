import { query } from "../db.js";

export async function recordAudit({
  organizationId,
  actorUserId = null,
  action,
  entityType,
  entityId = null,
  metadata = {},
  req = null,
}) {
  await query(
    `INSERT INTO audit_logs (organization_id,actor_user_id,action,entity_type,entity_id,metadata,ip_address,user_agent)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8)`,
    [
      organizationId,
      actorUserId,
      action,
      entityType,
      entityId == null ? null : String(entityId),
      JSON.stringify(metadata),
      req?.ip || null,
      req?.get?.("user-agent")?.slice(0, 500) || null,
    ],
  );
}
