import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getAuditLogs,
  exportAuditCsv,
  exportAuditPdf,
  getAlerts,
  updateAlertState,
  getOrganizationSettings,
  updateOrganizationSettings,
  listMembers,
  createInvitation,
  changeMemberRole,
  updateMemberStatus,
  archiveOrganization,
} from "../controllers/operationsController.js";
const router = Router();
router.use(requireAuth);
router.get("/audit-logs", getAuditLogs);
router.get("/audit-logs.csv", exportAuditCsv);
router.get("/audit-logs.pdf", exportAuditPdf);
router.get("/alerts", getAlerts);
router.post("/alerts/state", updateAlertState);
router.get("/organization", getOrganizationSettings);
router.patch("/organization", updateOrganizationSettings);
router.post("/organization/archive", archiveOrganization);
router.get("/members", listMembers);
router.post("/invitations", createInvitation);
router.patch("/members/:userId/role", changeMemberRole);
router.patch("/members/:userId/status", updateMemberStatus);
export default router;
