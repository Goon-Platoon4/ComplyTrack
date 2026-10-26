
import "dotenv/config";
import express from "express";
import multer from "multer";
import expressRateLimit from "express-rate-limit";
import net from "node:net";
import { timingSafeEqual } from "node:crypto";

const app = express();
app.use(expressRateLimit({ windowMs: 60 * 1000, limit: 60, standardHeaders: "draft-7", legacyHeaders: false }));

const HOST = "127.0.0.1";
const PORT = Number(process.env.CLAMAV_ADAPTER_PORT || 3311);
const CLAMAV_HOST = process.env.CLAMAV_HOST || "127.0.0.1";
const CLAMAV_PORT = Number(process.env.CLAMAV_PORT || 3310);
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const SCAN_TIMEOUT_MS = 120_000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
    fields: 2,
    parts: 3,
    fieldSize: 1024,
  },
});

function authorized(req) {
  const expected = process.env.CLAMAV_ADAPTER_TOKEN;
  const supplied = req.get("authorization") || "";

  if (!expected || !supplied.startsWith("Bearer ")) return false;

  const actualBuffer = Buffer.from(supplied.slice(7));
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

function scanWithClamAV(buffer) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({
      host: CLAMAV_HOST,
      port: CLAMAV_PORT,
    });

    let response = "";
    let settled = false;

    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      socket.destroy();

      if (error) reject(error);
      else resolve(result);
    };

    const timeout = setTimeout(() => {
      finish(new Error("Scanner timeout"));
    }, SCAN_TIMEOUT_MS);

    socket.setEncoding("utf8");

    socket.on("connect", () => {
      // ClamAV INSTREAM protocol: command, length-prefixed chunks,
      // then a zero-length chunk to finish the scan.
      socket.write("zINSTREAM\0");

      const chunkSize = 64 * 1024;

      for (let offset = 0; offset < buffer.length; offset += chunkSize) {
        const chunk = buffer.subarray(
          offset,
          Math.min(offset + chunkSize, buffer.length),
        );

        const length = Buffer.alloc(4);
        length.writeUInt32BE(chunk.length);

        socket.write(length);
        socket.write(chunk);
      }

      socket.write(Buffer.alloc(4));
      socket.end();
    });

    socket.on("data", (data) => {
      response += data;

      if (response.length > 4096) {
        finish(new Error("Unexpected scanner response"));
        return;
      }

      if (response.includes("\0") || response.includes("\n")) {
        const result = response.replace(/\0/g, "").trim();

        if (result.endsWith(" OK")) {
          finish(null, { status: "clean" });
        } else if (result.includes(" FOUND")) {
          finish(null, { status: "infected" });
        } else {
          finish(new Error("Unexpected scanner response"));
        }
      }
    });

    socket.on("error", (error) => finish(error));

    socket.on("end", () => {
      if (!settled) {
        finish(new Error("Scanner closed without a result"));
      }
    });
  });
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/scan", (req, res, next) => {
  if (!authorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "A file is required" });
  }

  try {
    const result = await scanWithClamAV(req.file.buffer);

    if (result.status === "infected") {
      return res.json({
        status: "infected",
        signature: "threat_detected",
      });
    }

    return res.json({ status: "clean" });
  } catch {
    // Never report a clean result when scanning fails.
    return res.status(503).json({
      status: "unavailable",
      error: "Scanner unavailable",
    });
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(status).json({ error: "Invalid upload" });
  }

  return res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, HOST, () => {
  console.log(`ClamAV HTTP adapter listening on http://${HOST}:${PORT}`);
});
