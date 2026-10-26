import jwt from "jsonwebtoken";
import { query } from "../db.js";
import { hashToken } from "../utils/crypto.js";

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer "))
    return res.status(401).json({ message: "Authentication required" });
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      return res
        .status(503)
        .json({ message: "Authentication service is not configured" });
    }
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "complytrack-api",
      audience: "complytrack-client",
    });
    if (!payload.sid || !payload.sub)
      return res.status(401).json({ message: "Invalid or expired token" });
    const { rows } = await query(
      `SELECT s.id AS session_id, s.user_id, s.expires_at, u.email, u.full_name, u.is_active,
              u.email_verified_at, u.mfa_enabled, m.organization_id, m.role, m.status AS membership_status,
              o.status AS organization_status, o.timezone, COALESCE(CASE WHEN os.settings->>'sessionTimeoutMinutes' IN ('15','30','60') THEN (os.settings->>'sessionTimeoutMinutes')::int END,30) AS session_timeout_minutes
       FROM auth_sessions s
       JOIN users u ON u.id = s.user_id
       JOIN organization_memberships m ON m.user_id = u.id AND m.organization_id = s.organization_id
       JOIN organizations o ON o.id = m.organization_id
       LEFT JOIN organization_settings os ON os.organization_id=o.id
       WHERE s.id = $1 AND s.user_id = $2 AND s.revoked_at IS NULL AND s.expires_at > NOW()
         AND u.is_active = TRUE AND m.status = 'active' AND o.status = 'active'
         AND s.token_hash = $3`,
      [payload.sid, payload.sub, hashToken(payload.th)],
    );
    if (!rows.length)
      return res.status(401).json({ message: "Session is no longer valid" });
    const session = rows[0];
    if (!session.email_verified_at)
      return res.status(403).json({ message: "Email verification required" });
    if (
      session.role === "Administrator" &&
      !session.mfa_enabled &&
      !["/mfa/enroll", "/mfa/confirm", "/me"].includes(req.path)
    ) {
      return res
        .status(403)
        .json({ message: "Administrator MFA setup is required" });
    }
    req.user = {
      id: session.user_id,
      email: session.email,
      fullName: session.full_name,
      organizationId: session.organization_id,
      role: session.role,
      timezone: session.timezone,
      sessionId: session.session_id,
      mfaEnabled: session.mfa_enabled,
    };
    await query(
      "UPDATE auth_sessions SET last_seen_at = NOW(), expires_at = LEAST(created_at + INTERVAL '24 hours', NOW() + make_interval(mins => $2)) WHERE id = $1",
      [session.session_id, session.session_timeout_minutes || 30],
    );
    return next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    return next(error);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ message: "Authentication required" });
    if (!roles.includes(req.user.role))
      return res.status(403).json({ message: "Insufficient permissions" });
    return next();
  };
}
