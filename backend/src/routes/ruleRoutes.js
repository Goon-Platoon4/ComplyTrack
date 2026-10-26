import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  listRules,
  updateRule,
  createRule,
} from "../controllers/ruleController.js";
const router = Router();
router.use(requireAuth);
router.get("/", listRules);
router.post("/", createRule);
router.patch("/:id", updateRule);
export default router;
