import { Router } from "express";
import { getContractors, getContractorById } from "../controllers/contractorController.js";

const router = Router();

router.get("/", getContractors);
router.get("/:id", getContractorById);

export default router;
