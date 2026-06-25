import express, { Request, Response, NextFunction } from "express";
import path from "node:path";
import healthRouter from "./routers/health.router.js";
import chatRouter from "./routers/chat.router.js";
import sessionRouter from "./routers/session.router.js";
import faqRouter from "./routers/faq.router.js";

import { fileURLToPath } from "node:url";

const app = express();

app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "../../frontend");

// Servir el frontend visual
app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, "index.html"));
});
app.use("/assets", express.static(publicDir));
app.get("/favicon.ico", (req: Request, res: Response) => {
  res.status(204).end();
});

// Registrar routers de la API
app.use(healthRouter);
app.use(chatRouter);
app.use(sessionRouter);
app.use(faqRouter);

// Manejo de ruta no encontrada (404)
app.use((req: Request, res: Response) => {
  const correlationId =
    req.headers["x-correlation-id"] || req.headers["x-request-id"] || null;
  return res.status(404).json({
    timestamp: new Date().toISOString(),
    status: 404,
    code: "NOT_FOUND",
    message: "Ruta no encontrada.",
    correlationId,
  });
});

// Middleware global de manejo de errores (500)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const correlationId =
    req.headers["x-correlation-id"] || req.headers["x-request-id"] || null;
  return res.status(err.status || 500).json({
    timestamp: new Date().toISOString(),
    status: err.status || 500,
    code: err.code || "INTERNAL_ERROR",
    message: err.message || "Error inesperado al procesar la solicitud.",
    correlationId,
  });
});

export default app;
