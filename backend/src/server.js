import "dotenv/config";
import { randomUUID } from "node:crypto";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "./middleware/rateLimit.js";
import contractorRoutes from "./routes/contractorRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import ruleRoutes from "./routes/ruleRoutes.js";
import operationsRoutes from "./routes/operationsRoutes.js";
import { pool } from "./db.js";

const app = express();
const port = Number(process.env.PORT || 5000);
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.disable("x-powered-by");
app.set("trust proxy", Number(process.env.TRUST_PROXY || 0));
app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" } }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin))
        return callback(null, true);
      return callback(new Error("Origin is not allowed by CORS"));
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  }),
);
app.use(express.json({ limit: "1mb", strict: true }));
app.use(express.urlencoded({ extended: false, limit: "16kb" }));
app.use((req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
});
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 60 }));
app.get("/api/health/live", (_req, res) =>
  res.json({ status: "ok", service: "complytrack-api" }),
);
app.get("/api/health/ready", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.json({ status: "ready", service: "complytrack-api" });
  } catch {
    return res
      .status(503)
      .json({ status: "unavailable", service: "complytrack-api" });
  }
});
app.use("/api/auth", authRoutes);
app.use("/api/contractors", contractorRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/rules", ruleRoutes);
app.use("/api/operations", operationsRoutes);
app.use((_req, res) =>
  res.status(404).json({ message: "Endpoint not found." }),
);

app.use((err, req, res, next) => {
  const status = Number(err.status || err.statusCode || 500);

  console.error(
    JSON.stringify(
      {
        level: "error",
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        status,
        message: err.message,
        code: err.code || null,
        detail: err.detail || null,
        where: err.where || null,
        constraint: err.constraint || null,
        stack: err.stack || null,
      },
      null,
      2,
    ),
  );

  if (res.headersSent) return next(err);

  return res.status(status).json({
    message:
      status >= 500
        ? "An unexpected server error occurred."
        : err.message || "Request failed.",
    requestId: req.requestId,
  });
});


if (process.env.NODE_ENV !== "test") {
  const server = app.listen(port, () =>
    console.log(`ComplyTrack API listening on port ${port}`),
  );
  const shutdown = (signal) => {
    console.log(`Received ${signal}; shutting down.`);
    server.close(() => pool.end().finally(() => process.exit(0)));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
export default app;
