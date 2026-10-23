import { Router } from "express";
import {
  getSummary,
  getContractorReport,
  getExpiringDocuments,
  getCategoryBreakdown,
} from "../controllers/reportController.js";

const router = Router();

router.get("/summary", getSummary);
router.get("/contractors", getContractorReport);
router.get("/expiring", getExpiringDocuments);
router.get("/by-category", getCategoryBreakdown);

export default router;