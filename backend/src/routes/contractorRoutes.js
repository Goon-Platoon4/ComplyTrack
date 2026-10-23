import { Router } from "express";
import {
  getContractors,
  getContractorById,
  createContractor,
  updateContractor,
  deleteContractor,
} from "../controllers/contractorController.js";

const router = Router();

router.get("/", getContractors);
router.get("/:id", getContractorById);
router.post("/", createContractor);
router.put("/:id", updateContractor);
router.delete("/:id", deleteContractor);

export default router;