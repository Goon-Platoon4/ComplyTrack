import jwt from "jsonwebtoken";
import {
  hashPassword,
  verifyPassword,
  generateTotpSecret,
  verifyTotp,
} from "../utils/passwords.js";
import { query, pool } from "../db.js";
import { createOpaqueToken, hashToken } from "../utils/crypto.js";
import { sendTransactionalEmail } from "../services/emailService.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 12;
const COMMON_PASSWORDS = new Set([
  "password123456",
  "passwordpassword",
  "qwerty123456",
  "123456789012",
  "letmein123456",
  "admin12345678",
]);
const publicUser = (row) => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  organizationId: row.organization_id,
  role: row.role,
  mfaEnabled: row.mfa_enabled,
});

function validatePassword(password) {
  return (
    typeof password === "string" &&
    password.length >= PASSWORD_MIN &&
    password.length <= 128 &&
    !/^\s+$/.test(password) &&
    !COMMON_PASSWORDS.has(password.toLowerCase())
  );
}

async function issueSession(user, membership, req, res) {
  const sessionKey = createOpaqueToken(32);
  const { rows } = await query(
    `INSERT INTO auth_sessions (user_id, organization_id, token_hash, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, NOW() + INTERVAL '30 minutes', $4, $5) RETURNING id`,
    [
      user.id,
      membership.organization_id,
      hashToken(sessionKey),
      req.ip || null,
      req.get("user-agent")?.slice(0, 500) || null,
    ],
  );
  const token = jwt.sign(
    { sub: user.id, sid: rows[0].id, th: sessionKey },
    process.env.JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "24h",
      issuer: "complytrack-api",
      audience: "complytrack-client",
    },
  );
  await query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [
    user.id,
  ]);
  res.json({
    token,
    user: publicUser({
      ...user,
      organization_id: membership.organization_id,
      role: membership.role,
    }),
  });
}

export async function register(req, res, next) {
  const client = await pool.connect();

  try {
    const { fullName, email, password, organizationName, invitationToken } =
      req.body || {};

    if (
      process.env.NODE_ENV === "production" &&
      (!process.env.EMAIL_API_URL ||
        !process.env.EMAIL_API_KEY ||
        !process.env.EMAIL_FROM)
    ) {
      return res.status(503).json({
        message:
          "Account registration is temporarily unavailable because transactional email is not configured.",
      });
    }

    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (
      typeof fullName !== "string" ||
      !fullName.trim() ||
      fullName.trim().length > 120 ||
      !EMAIL_RE.test(normalizedEmail) ||
      !validatePassword(password)
    ) {
      return res.status(400).json({
        message: `Provide a name, valid email, and password of at least ${PASSWORD_MIN} characters.`,
      });
    }

    if (invitationToken && typeof invitationToken !== "string") {
      return res.status(400).json({
        message: "Invitation token is invalid.",
      });
    }

    if (
      !invitationToken &&
      (typeof organizationName !== "string" ||
        !organizationName.trim() ||
        organizationName.trim().length > 180)
    ) {
      return res.status(400).json({
        message:
          "An organization name is required to create a new organization.",
      });
    }

    const passwordHash = await hashPassword(password);

    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT id FROM users WHERE lower(email) = $1",
      [normalizedEmail],
    );

    if (existing.rowCount) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: "Unable to create the account with those details.",
      });
    }

    const insertedUser = await client.query(
      `INSERT INTO users
        (full_name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id, full_name, email, mfa_enabled`,
      [fullName.trim(), normalizedEmail, passwordHash, "Compliance Officer"],
    );

    const user = insertedUser.rows[0];
    let membership;

    if (invitationToken) {
      const invitation = await client.query(
        `SELECT id, organization_id, role
         FROM organization_invitations
         WHERE token_hash = $1
           AND lower(email) = $2
           AND accepted_at IS NULL
           AND revoked_at IS NULL
           AND expires_at > NOW()
         FOR UPDATE`,
        [hashToken(invitationToken), normalizedEmail],
      );

      if (!invitation.rowCount) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: "Invitation is invalid or expired.",
        });
      }

      membership = invitation.rows[0];

      await client.query(
        `INSERT INTO organization_memberships
          (organization_id, user_id, role)
         VALUES ($1, $2, $3)`,
        [membership.organization_id, user.id, membership.role],
      );

      await client.query(
        `UPDATE organization_invitations
         SET accepted_at = NOW(), accepted_by = $2
         WHERE id = $1`,
        [membership.id, user.id],
      );
    } else {
      const org = await client.query(
        `INSERT INTO organizations (name, contact_email)
         VALUES ($1, $2)
         RETURNING id`,
        [organizationName.trim(), normalizedEmail],
      );

      membership = {
        organization_id: org.rows[0].id,
        role: "Administrator",
      };

      await client.query(
        `INSERT INTO organization_memberships
          (organization_id, user_id, role)
         VALUES ($1, $2, $3)`,
        [membership.organization_id, user.id, membership.role],
      );

      await client.query(
        `INSERT INTO organization_settings (organization_id, settings)
         VALUES ($1, $2::jsonb)`,
        [
          membership.organization_id,
          JSON.stringify({
            sessionTimeoutMinutes: 30,
            reminderMode: "in_app",
          }),
        ],
      );

      await client.query(
        `INSERT INTO compliance_rules
          (organization_id, document_type_id, category, is_required,
           required_for_site_work, expiry_tracked, reminder_days)
         SELECT
           $1,
           id,
           CASE
             WHEN name ILIKE '%tax%' THEN 'Tax'
             WHEN name ILIKE '%COIDA%' OR name ILIKE '%OHS%'
               THEN 'Health & Safety'
             WHEN name ILIKE '%B-BBEE%' THEN 'Business Compliance'
             WHEN name ILIKE '%insurance%' THEN 'Insurance'
             ELSE 'Other'
           END,
           TRUE,
           required_for_site_work,
           name NOT ILIKE '%OHS%',
           CASE WHEN name ILIKE '%OHS%' THEN 0 ELSE 30 END
         FROM document_types
         ON CONFLICT (organization_id, document_type_id) DO NOTHING`,
        [membership.organization_id],
      );
    }

    const rawToken = createOpaqueToken();

    await client.query(
      `INSERT INTO auth_tokens
        (user_id, token_hash, purpose, expires_at)
       VALUES ($1, $2, 'verify_email', NOW() + INTERVAL '24 hours')`,
      [user.id, hashToken(rawToken)],
    );

    // Use separate parameters for the actor UUID and entity identifier.
    // This assumes audit_logs.entity_id is a text-compatible column.
    await client.query(
      `INSERT INTO audit_logs
        (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1::uuid, $2::uuid, 'auth.register', 'user', $3::text, $4::jsonb)`,
      [
        membership.organization_id,
        user.id,
        String(user.id),
        JSON.stringify({ role: membership.role }),
      ],
    );

    await client.query("COMMIT");

    const appBaseUrl = (
      process.env.APP_BASE_URL || "http://localhost:5173"
    ).replace(/\/+$/, "");

    const verifyUrl = `${appBaseUrl}/verify-email?token=${encodeURIComponent(rawToken)}`;

    let emailDelivery = "failed";

    try {
      const delivery = await sendTransactionalEmail({
        to: normalizedEmail,
        subject: "Verify your ComplyTrack email",
        text: `Verify your ComplyTrack email using this link (valid for 24 hours): ${verifyUrl}`,
      });

      emailDelivery = delivery.delivered ? "sent" : "not_configured";
    } catch (mailError) {
      console.error("Verification email delivery failed:", mailError.message);
    }

    const response = {
      message:
        emailDelivery === "sent"
          ? "Account created. Verify your email before signing in."
          : "Account created, but verification email delivery is not confirmed. Request a new verification email or use the development token.",
      emailDelivery,
    };

    if (process.env.NODE_ENV !== "production" && emailDelivery !== "sent") {
      response.developmentVerificationToken = rawToken;
    }

    return res.status(201).json(response);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    return next(error);
  } finally {
    client.release();
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const token = req.body?.token;
    if (typeof token !== "string" || token.length < 20)
      return res
        .status(400)
        .json({ message: "Verification token is invalid or expired." });
    const { rows } = await query(
      `UPDATE auth_tokens SET consumed_at = NOW() WHERE token_hash = $1 AND purpose = 'verify_email' AND consumed_at IS NULL AND expires_at > NOW() RETURNING user_id`,
      [hashToken(token)],
    );
    if (!rows.length)
      return res
        .status(400)
        .json({ message: "Verification token is invalid or expired." });
    await query("UPDATE users SET email_verified_at = NOW() WHERE id = $1", [
      rows[0].user_id,
    ]);
    await query(
      `INSERT INTO audit_logs (organization_id,actor_user_id,action,entity_type,entity_id) SELECT m.organization_id,u.id,'auth.email_verified','user',u.id::text FROM users u JOIN organization_memberships m ON m.user_id=u.id WHERE u.id=$1`,
      [rows[0].user_id],
    );
    return res.json({ message: "Email verified. You can now sign in." });
  } catch (error) {
    return next(error);
  }
}

export async function resendVerification(req, res, next) {
  try {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    let developmentToken;
    if (EMAIL_RE.test(email)) {
      const { rows } = await query(
        "SELECT id,email,email_verified_at FROM users WHERE lower(email)=$1 AND is_active=TRUE",
        [email],
      );
      if (rows.length && !rows[0].email_verified_at) {
        const token = createOpaqueToken();
        await query(
          `INSERT INTO auth_tokens (user_id,token_hash,purpose,expires_at) VALUES ($1,$2,'verify_email',NOW()+INTERVAL '24 hours')`,
          [rows[0].id, hashToken(token)],
        );
        const url = `${process.env.APP_BASE_URL || "http://localhost:5173"}/verify-email?token=${encodeURIComponent(token)}`;
        let deliveryStatus = false;
        try {
          deliveryStatus = (
            await sendTransactionalEmail({
              to: rows[0].email,
              subject: "Verify your ComplyTrack email",
              text: `Verify your email within 24 hours: ${url}`,
            })
          ).delivered;
        } catch (mailError) {
          console.error(
            "Verification email delivery failed:",
            mailError.message,
          );
        }
        if (process.env.NODE_ENV !== "production" && !deliveryStatus)
          developmentToken = token;
      }
    }
    const response = {
      message:
        "If the account exists and needs verification, instructions will be sent.",
    };
    if (developmentToken)
      response.developmentVerificationToken = developmentToken;
    return res.json(response);
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const password = req.body?.password;
    if (!EMAIL_RE.test(email) || typeof password !== "string")
      return res
        .status(400)
        .json({ message: "Enter your email and password." });
    const { rows } = await query(
      `SELECT u.* FROM users u WHERE lower(u.email) = $1 AND u.is_active = TRUE LIMIT 1`,
      [email],
    );
    const user = rows[0];
      if (user) {
      // FR-01: 5 failed sign-ins within 15 minutes lock the account for 15
      // minutes. Failures before the user's last successful sign-in are ignored.
      const failures = await query(
        `SELECT COUNT(*)::int AS count, MIN(created_at) AS first_failure, MAX(created_at) AS last_failure
         FROM (
           SELECT created_at FROM audit_logs
           WHERE actor_user_id = $1 AND action = 'auth.login_failed'
             AND created_at > NOW() - INTERVAL '30 minutes'
             AND created_at > COALESCE((SELECT MAX(created_at) FROM auth_sessions WHERE user_id = $1), '-infinity')
           ORDER BY created_at DESC
           LIMIT 5
         ) recent`,
        [user.id],
      );
      const { count, first_failure, last_failure } = failures.rows[0];
      const lockedUntil = last_failure ? new Date(last_failure).getTime() + 15 * 60 * 1000 : 0;
      if (
        count >= 5 &&
        new Date(last_failure) - new Date(first_failure) <= 15 * 60 * 1000 &&
        Date.now() < lockedUntil
      ) {
        await query(
          `INSERT INTO audit_logs (actor_user_id,action,entity_type,metadata) VALUES ($1,'auth.login_locked','user',$2::jsonb)`,
          [user.id, JSON.stringify({ lockedUntil: new Date(lockedUntil).toISOString() })],
        );
        return res.status(423).json({
          message: "This account is locked for 15 minutes after 5 failed sign-in attempts.",
        });
      }
    }
    const valid = user?.password_hash
      ? await verifyPassword(password, user.password_hash)
      : false;
    if (!valid) {
      await query(
        `INSERT INTO audit_logs (actor_user_id,action,entity_type,metadata) VALUES ($1,'auth.login_failed','user',$2::jsonb)`,
        [
          user?.id || null,
          JSON.stringify({ emailDomain: email.split("@")[1] || null }),
        ],
      );
      return res.status(401).json({ message: "Invalid email or password." });
    }
    if (!user.email_verified_at)
      return res
        .status(403)
        .json({ message: "Verify your email before signing in." });
    const requestedOrganization =
      typeof req.body?.organizationId === "string"
        ? req.body.organizationId
        : null;
    if (
      requestedOrganization &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        requestedOrganization,
      )
    )
      return res
        .status(400)
        .json({ message: "Organization selection is invalid." });
    const memberships = await query(
      `SELECT m.organization_id,m.role,o.status FROM organization_memberships m JOIN organizations o ON o.id=m.organization_id WHERE m.user_id=$1 AND m.status='active' AND o.status='active' AND ($2::uuid IS NULL OR m.organization_id=$2::uuid) ORDER BY m.created_at`,
      [user.id, requestedOrganization],
    );
    if (!memberships.rowCount)
      return res.status(403).json({
        message: "No active organization access is available for this account.",
      });
    const membership = memberships.rows[0];
    if (membership.role === "Administrator" && user.mfa_enabled) {
      const code = String(req.body?.mfaCode || "");
      let validMfa = false;
      if (/^\d{6}$/.test(code) && user.mfa_secret_encrypted) {
        const { decryptSecret } = await import("../utils/secretEncryption.js");
        validMfa = verifyTotp(code, decryptSecret(user.mfa_secret_encrypted));
      }
      if (
        !validMfa &&
        code.length >= 8 &&
        Array.isArray(user.recovery_codes_hashes)
      ) {
        for (let i = 0; i < user.recovery_codes_hashes.length; i += 1) {
          if (await verifyPassword(code, user.recovery_codes_hashes[i])) {
            user.recovery_codes_hashes.splice(i, 1);
            await query(
              "UPDATE users SET recovery_codes_hashes=$1 WHERE id=$2",
              [user.recovery_codes_hashes, user.id],
            );
            validMfa = true;
            await query(
              `INSERT INTO audit_logs (organization_id,actor_user_id,action,entity_type,entity_id,metadata) VALUES ($1,$2,'security.mfa_recovery_code_used','user',$2,$3::jsonb)`,
              [
                membership.organization_id,
                user.id,
                JSON.stringify({
                  remainingCodes: user.recovery_codes_hashes.length,
                }),
              ],
            );
            break;
          }
        }
      }
      if (!validMfa) {
        await query(
          `INSERT INTO audit_logs (
    organization_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    metadata,
    ip_address,
    user_agent
  )
  VALUES (
    $1::uuid,
    $2::uuid,
    'security.mfa_login_failed',
    'user',
    $3::text,
    $4::jsonb,
    $5::inet,
    $6::text
  )`,
          [
            membership.organization_id,
            user.id,
            String(user.id),
            JSON.stringify({
              method: code.length >= 8 ? "recovery_code" : "authenticator",
            }),
            req.ip || null,
            req.get("user-agent")?.slice(0, 500) || null,
          ],
        );
        return res.status(401).json({
          message:
            "A valid authenticator code or unused recovery code is required.",
          code: "MFA_REQUIRED",
        });
      }
    }
    // Administrators without MFA receive a restricted session only for enrollment/confirmation endpoints.
    return issueSession(user, membership, req, res);
  } catch (error) {
    return next(error);
  }
}

export async function acceptInvitation(req, res, next) {
  const client = await pool.connect();
  try {
    const token = req.body?.invitationToken;
    if (typeof token !== "string" || token.length < 20)
      return res
        .status(400)
        .json({ message: "Invitation token is invalid or expired." });
    await client.query("BEGIN");
    const userResult = await client.query(
      "SELECT id,email FROM users WHERE id=$1 AND is_active=TRUE AND email_verified_at IS NOT NULL FOR UPDATE",
      [req.user.id],
    );
    if (!userResult.rowCount) {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ message: "Verify your email before accepting an invitation." });
    }
    const invitation = await client.query(
      `SELECT id,organization_id,email,role,accepted_at,accepted_by FROM organization_invitations WHERE token_hash=$1 AND lower(email)=lower($2) AND revoked_at IS NULL AND expires_at>NOW() FOR UPDATE`,
      [hashToken(token), userResult.rows[0].email],
    );
    if (!invitation.rowCount) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message:
          "Invitation is invalid, expired, or belongs to a different email.",
      });
    }
    const invite = invitation.rows[0];
    if (invite.accepted_at) {
      if (invite.accepted_by === req.user.id) {
        await client.query("COMMIT");
        return res.json({
          message: "Invitation was already accepted.",
          organizationId: invite.organization_id,
          role: invite.role,
        });
      }
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "Invitation has already been accepted." });
    }
    await client.query(
      `INSERT INTO organization_memberships (organization_id,user_id,role,status) VALUES ($1,$2,$3,'active') ON CONFLICT (organization_id,user_id) DO UPDATE SET role=EXCLUDED.role,status='active',updated_at=NOW()`,
      [invite.organization_id, req.user.id, invite.role],
    );
    await client.query(
      "UPDATE organization_invitations SET accepted_at=NOW(),accepted_by=$2 WHERE id=$1",
      [invite.id, req.user.id],
    );
    await client.query(
      "UPDATE auth_sessions SET organization_id=$1 WHERE id=$2 AND user_id=$3 AND revoked_at IS NULL",
      [invite.organization_id, req.user.sessionId, req.user.id],
    );
    await client.query(
      `INSERT INTO audit_logs (organization_id,actor_user_id,action,entity_type,entity_id,metadata) VALUES ($1,$2,'organization.invitation_accepted','invitation',$3,$4::jsonb)`,
      [
        invite.organization_id,
        req.user.id,
        invite.id,
        JSON.stringify({ role: invite.role }),
      ],
    );
    await client.query("COMMIT");
    return res.json({
      message: "Invitation accepted.",
      organizationId: invite.organization_id,
      role: invite.role,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    return next(error);
  } finally {
    client.release();
  }
}

export async function logout(req, res, next) {
  try {
    await query(
      "UPDATE auth_sessions SET revoked_at = NOW() WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL",
      [req.user.sessionId, req.user.id],
    );
    await query(
      `INSERT INTO audit_logs (organization_id,actor_user_id,action,entity_type,entity_id) VALUES ($1,$2,'auth.logout','session',$3)`,
      [req.user.organizationId, req.user.id, req.user.sessionId],
    );
    return res.json({ message: "Signed out." });
  } catch (error) {
    return next(error);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    if (EMAIL_RE.test(email)) {
      const { rows } = await query(
        "SELECT id,email FROM users WHERE lower(email)=$1 AND is_active=TRUE",
        [email],
      );
      if (rows.length) {
        const token = createOpaqueToken();
        await query(
          `INSERT INTO auth_tokens (user_id,token_hash,purpose,expires_at) VALUES ($1,$2,'reset_password',NOW()+INTERVAL '30 minutes')`,
          [rows[0].id, hashToken(token)],
        );
        const url = `${process.env.APP_BASE_URL || "http://localhost:5173"}/reset-password?token=${encodeURIComponent(token)}`;
        let deliveryStatus = false;
        try {
          deliveryStatus = (
            await sendTransactionalEmail({
              to: rows[0].email,
              subject: "Reset your ComplyTrack password",
              text: `Use this link within 30 minutes to reset your password: ${url}`,
            })
          ).delivered;
        } catch (mailError) {
          console.error(
            "Password reset email delivery failed:",
            mailError.message,
          );
        }
        if (process.env.NODE_ENV !== "production" && !deliveryStatus)
          res.locals.developmentResetToken = token;
      }
    }
    const response = {
      message:
        "If an account matches that email, password reset instructions will be sent.",
    };
    if (res.locals.developmentResetToken)
      response.developmentResetToken = res.locals.developmentResetToken;
    return res.json(response);
  } catch (error) {
    return next(error);
  }
}

export async function resetPassword(req, res, next) {
  const client = await pool.connect();
  try {
    const { token, password } = req.body || {};
    if (typeof token !== "string" || !validatePassword(password))
      return res.status(400).json({
        message: `A valid reset token and password of at least ${PASSWORD_MIN} characters are required.`,
      });
    await client.query("BEGIN");
    const found = await client.query(
      `SELECT id,user_id FROM auth_tokens WHERE token_hash=$1 AND purpose='reset_password' AND consumed_at IS NULL AND expires_at>NOW() FOR UPDATE`,
      [hashToken(token)],
    );
    if (!found.rowCount) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "Reset token is invalid or expired." });
    }
    const userId = found.rows[0].user_id;
    await client.query(
      "UPDATE users SET password_hash=$1,updated_at=NOW() WHERE id=$2",
      [await hashPassword(password), userId],
    );
    await client.query(
      "UPDATE auth_tokens SET consumed_at=NOW() WHERE user_id=$1 AND purpose='reset_password' AND consumed_at IS NULL",
      [userId],
    );
    await client.query(
      "UPDATE auth_sessions SET revoked_at=NOW() WHERE user_id=$1 AND revoked_at IS NULL",
      [userId],
    );
    await client.query(
      `INSERT INTO audit_logs (actor_user_id,action,entity_type,entity_id) VALUES ($1,'auth.password_reset','user',$1)`,
      [userId],
    );
    await client.query("COMMIT");
    return res.json({
      message: "Password reset. Sign in using your new password.",
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    return next(error);
  } finally {
    client.release();
  }
}

export async function beginMfaEnrollment(req, res, next) {
  try {
    if (req.user.role !== "Administrator") {
      return res
        .status(403)
        .json({ message: "MFA enrollment is available to Administrators." });
    }

    if (
      !process.env.MFA_ENCRYPTION_KEY ||
      process.env.MFA_ENCRYPTION_KEY.length < 32
    ) {
      return res
        .status(503)
        .json({ message: "MFA encryption is not configured." });
    }

    const secret = generateTotpSecret();

    const uri = `otpauth://totp/${encodeURIComponent(
      `ComplyTrack:${req.user.email}`,
    )}?secret=${secret}&issuer=ComplyTrack&algorithm=SHA1&digits=6&period=30`;

    const { encryptSecret } = await import("../utils/secretEncryption.js");
    const encryptedSecret = encryptSecret(secret);

    const result = await query(
      `UPDATE users
       SET mfa_pending_secret_encrypted = $1
       WHERE id = $2
       RETURNING id, mfa_pending_secret_encrypted`,
      [encryptedSecret, req.user.id],
    );

    console.log("[MFA ENROLLMENT SAVE]", {
      userId: req.user.id,
      rowsUpdated: result.rowCount,
      pendingSecretSaved: Boolean(result.rows[0]?.mfa_pending_secret_encrypted),
    });

    if (
      result.rowCount !== 1 ||
      !result.rows[0]?.mfa_pending_secret_encrypted
    ) {
      return res.status(500).json({
        message: "Could not save the pending MFA enrollment.",
      });
    }

    return res.json({
      secret,
      otpauthUrl: uri,
      message:
        "Scan the QR code in an authenticator app, then confirm with a current code.",
    });
  } catch (error) {
    console.error("[MFA ENROLLMENT ERROR]", {
      message: error.message,
      code: error.code ?? null,
      constraint: error.constraint ?? null,
    });

    return next(error);
  }
}

export async function confirmMfaEnrollment(req, res, next) {
  try {
    const { code } = req.body || {};

    const { rows } = await query(
      "SELECT mfa_pending_secret_encrypted FROM users WHERE id=$1",
      [req.user.id],
    );

    console.log("[MFA DEBUG]", {
      userFound: Boolean(rows[0]),
      pendingSecretExists: Boolean(rows[0]?.mfa_pending_secret_encrypted),
      codeLength: String(code ?? "").length,
      codeIsSixDigits: /^\d{6}$/.test(String(code ?? "")),
    });

    if (
      !rows[0]?.mfa_pending_secret_encrypted ||
      !/^\d{6}$/.test(String(code || ""))
    ) {
      return res
        .status(400)
        .json({ message: "Complete MFA setup using a valid six-digit code." });
    }

    const { decryptSecret } = await import("../utils/secretEncryption.js");
    const secret = decryptSecret(rows[0].mfa_pending_secret_encrypted);

    if (!verifyTotp(String(code), secret)) {
      return res
        .status(400)
        .json({ message: "Authenticator code is invalid." });
    }

    const recoveryCodes = Array.from({ length: 8 }, () =>
      createOpaqueToken(8).toUpperCase(),
    );

    const hashes = await Promise.all(
      recoveryCodes.map((value) => hashPassword(value)),
    );

    await query(
      `UPDATE users
       SET mfa_secret_encrypted = $1,
           mfa_pending_secret_encrypted = NULL,
           mfa_enabled = TRUE,
           recovery_codes_hashes = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [rows[0].mfa_pending_secret_encrypted, hashes, req.user.id],
    );

    await query(
      `INSERT INTO audit_logs
       (organization_id, actor_user_id, action, entity_type, entity_id)
       VALUES ($1, $2, 'security.mfa_enabled', 'user', $3)`,
      [req.user.organizationId, req.user.id, String(req.user.id)],
    );

    return res.json({
      message:
        "MFA enabled. Store these recovery codes securely; they will not be shown again.",
      recoveryCodes,
    });
  } catch (error) {
    console.error("[MFA CONFIRM ERROR]", error);
    return next(error);
  }
}

export async function getCurrentUser(req, res) {
  return res.json({
    user: {
      id: req.user.id,
      fullName: req.user.fullName,
      email: req.user.email,
      organizationId: req.user.organizationId,
      role: req.user.role,
      timezone: req.user.timezone,
      mfaEnabled: req.user.mfaEnabled,
    },
  });
}

export async function listUserOrganizations(req, res, next) {
  try {
    const { rows } = await query(
      `SELECT o.id,o.name,m.role,o.timezone FROM organization_memberships m JOIN organizations o ON o.id=m.organization_id WHERE m.user_id=$1 AND m.status='active' AND o.status='active' ORDER BY o.name`,
      [req.user.id],
    );
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
}

export async function selectOrganization(req, res, next) {
  try {
    const organizationId = req.body?.organizationId;
    if (
      typeof organizationId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        organizationId,
      )
    )
      return res.status(400).json({ message: "Choose a valid organization." });
    const { rows } = await query(
      `SELECT m.organization_id,m.role,o.timezone FROM organization_memberships m JOIN organizations o ON o.id=m.organization_id WHERE m.user_id=$1 AND m.organization_id=$2 AND m.status='active' AND o.status='active'`,
      [req.user.id, organizationId],
    );
    if (!rows.length)
      return res
        .status(403)
        .json({ message: "You do not have access to that organization." });
    await query(
      "UPDATE auth_sessions SET organization_id=$1 WHERE id=$2 AND user_id=$3 AND revoked_at IS NULL",
      [organizationId, req.user.sessionId, req.user.id],
    );
    return res.json({
      organizationId,
      role: rows[0].role,
      timezone: rows[0].timezone,
    });
  } catch (error) {
    return next(error);
  }
}
