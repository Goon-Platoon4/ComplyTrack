import express, { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getDocuments,
  getDocumentHistory,
  getContractorDocuments,
  getDocumentDownloadUrl,
} from "../controllers/documentController.js";
import { uploadDocument } from "../controllers/documentUploadController.js";
const router = Router();
router.use(requireAuth);
router.get("/", getDocuments);
router.get("/contractor/:contractorId", getContractorDocuments);
router.get(
  "/contractor/:contractorId/type/:documentTypeId/history",
  getDocumentHistory,
);
router.post(
  "/upload",
  (req, res, next) => {
    if (!req.is("application/octet-stream"))
      return res
        .status(415)
        .json({ message: "Upload using application/octet-stream." });
    next();
  },
  express.raw({ type: "application/octet-stream", limit: "10mb" }),
  uploadDocument,
);
router.get("/:id/download-url", getDocumentDownloadUrl);
export default router;
