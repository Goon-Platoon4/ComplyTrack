import { Router } from "express";
import { getSummary } from "../controllers/reportController.js";

const router = Router();

router.get("/summary", getSummary);

export default router;
