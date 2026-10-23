import { Router } from "express";
import {
  getDocumentTypes,
  getDocuments,
  getContractorChecklist,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
} from "../controllers/documentController.js";

const router = Router();

// Specific paths must come before "/:id", otherwise "types" is treated as an id.
router.get("/types", getDocumentTypes);
router.get("/checklist/:contractorId", getContractorChecklist);
router.get("/", getDocuments);
router.get("/:id", getDocumentById);
router.post("/", createDocument);
router.put("/:id", updateDocument);
router.delete("/:id", deleteDocument);

export default router;