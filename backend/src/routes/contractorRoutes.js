import { Router } from "express";
import {
  getContractors,
  getContractorById,
  createContractor,
  updateContractor,
  getContractorComplianceDetails,
} from "../controllers/contractorController.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
router.use(requireAuth);
router.get("/", getContractors);
router.post("/", createContractor);
router.get("/:id/compliance", getContractorComplianceDetails);
router.get("/:id", getContractorById);
router.patch("/:id", updateContractor);
export default router;
