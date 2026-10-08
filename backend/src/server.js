import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import contractorRoutes from "./routes/contractorRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "complytrack-api", timestamp: new Date().toISOString() });
});

app.use("/api/contractors", contractorRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/reports", reportRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(port, () => console.log(`ComplyTrack API listening on port ${port}`));
