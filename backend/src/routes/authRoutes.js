import { Router } from "express";
import { rateLimit } from "../middleware/rateLimit.js";
import { requireAuth } from "../middleware/auth.js";
import {
  register,
  verifyEmail,
  resendVerification,
  login,
  logout,
  forgotPassword,
  resetPassword,
  beginMfaEnrollment,
  confirmMfaEnrollment,
  getCurrentUser,
  acceptInvitation,
  listUserOrganizations,
  selectOrganization,
} from "../controllers/authController.js";

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10 });
router.post("/register", authLimiter, register);
router.post("/verify-email", authLimiter, verifyEmail);
router.post("/resend-verification", authLimiter, resendVerification);
router.post("/login", authLimiter, login);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.get("/me", requireAuth, getCurrentUser);
router.get("/organizations", requireAuth, listUserOrganizations);
router.post("/select-organization", requireAuth, selectOrganization);
router.post("/accept-invitation", requireAuth, acceptInvitation);
router.post("/logout", requireAuth, logout);
router.post("/mfa/enroll", requireAuth, beginMfaEnrollment);
router.post("/mfa/confirm", requireAuth, confirmMfaEnrollment);
export default router;
