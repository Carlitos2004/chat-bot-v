import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { processMessage } from "./application/processMessage.js";
import { getSession } from "./infrastructure/sessionStore.js";
import { getFaq } from "./application/faqService.js";
import { config } from "./config.js";

// Ruta relativa desde backend/src/ a frontend/
const publicDir = fileURLToPath(new URL("../../frontend", import.meta.url));

export async function handleRequest(req, res) {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const correlationId = req.headers["x-correlation-id"] ?? randomUUID();

    // 1. Endpoint de Salud obligatorio /health (no requiere API Key)
    if (req.method === "GET" && url.pathname === "/health") {
      const geminiStatus = config.gemini.apiKey ? "ok" : "error";
      const isMock = config.mockMode;

      return sendJson(res, 200, {
        status: geminiStatus === "ok" ? "ok" : "degraded",
        version: "1.1",
        dependencies: {
          gemini: geminiStatus,
          auth_service: config.services.auth ? "ok" : (isMock ? "ok" : "error"),
          catalog_service: config.services.catalog ? "ok" : (isMock ? "ok" : "error"),
          order_service: config.services.order ? "ok" : (isMock ? "ok" : "error"),
          payment_service: config.services.payment ? "ok" : (isMock ? "ok" : "error"),
          inventory_service: config.services.inventory ? "ok" : (isMock ? "ok" : "error"),
          shipment_service: config.services.shipping ? "ok" : (isMock ? "ok" : "error"),
          notification_service: config.services.notification ? "ok" : (isMock ? "ok" : "error"),
        },
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Servir archivos estáticos del frontend (no requiere API Key)
    if (req.method === "GET" && (url.pathname === "/" || url.pathname.startsWith("/assets/"))) {
      return servePublicFile(url.pathname, res);
    }

    // 3. Validación de X-Api-Key para rutas de la API del Chatbot
    const isChatRoute = url.pathname === "/chat/message" ||
                        url.pathname.startsWith("/chat/session/") ||
                        url.pathname.startsWith("/chat/faq/");

    if (isChatRoute) {
      const apiKey = req.headers["x-api-key"];
      const validApiKey = process.env.CHATBOT_API_KEY || "mk-chatbot-abc123xyz";

      if (!apiKey) {
        return sendJson(res, 401, {
          timestamp: new Date().toISOString(),
          status: 401,
          code: "MISSING_API_KEY",
          message: "Se requiere el header X-Api-Key para acceder a este servicio.",
          correlationId,
        });
      }

      if (apiKey !== validApiKey) {
        return sendJson(res, 401, {
          timestamp: new Date().toISOString(),
          status: 401,
          code: "INVALID_API_KEY",
          message: "La API Key proporcionada no es válida.",
          correlationId,
        });
      }
    }

    // 4. POST /chat/message -> Endpoint conversacional principal
    if (req.method === "POST" && url.pathname === "/chat/message") {
      const body = await readJson(req);
      const result = await processMessage({
        body,
        headers: req.headers,
      });

      return sendJson(res, result.statusCode, result.payload);
    }

    // 5. GET /chat/session/{session_id} -> Obtener historial de sesión
    const sessionMatch = url.pathname.match(/^\/chat\/session\/([^/]+)$/);
    if (req.method === "GET" && sessionMatch) {
      const sessionId = decodeURIComponent(sessionMatch[1]);
      const session = getSession(sessionId);

      if (!session) {
        return sendJson(res, 404, {
          timestamp: new Date().toISOString(),
          status: 404,
          code: "SESSION_NOT_FOUND",
          message: "No existe una sesion con el ID proporcionado.",
          correlationId,
        });
      }

      return sendJson(res, 200, session);
    }

    // 6. GET /chat/faq/{category} -> FAQ categorizado
    const faqMatch = url.pathname.match(/^\/chat\/faq\/([^/]+)$/);
    if (req.method === "GET" && faqMatch) {
      const category = decodeURIComponent(faqMatch[1]);
      const validCategories = ["faq_envios", "faq_pagos", "faq_cuenta", "faq_productos"];

      if (!validCategories.includes(category)) {
        return sendJson(res, 400, {
          timestamp: new Date().toISOString(),
          status: 400,
          code: "INVALID_FAQ_CATEGORY",
          message: `La categoría '${category}' no es válida. Use faq_envios, faq_pagos, faq_cuenta o faq_productos.`,
          correlationId,
        });
      }

      const faqResult = await getFaq({ category, correlationId });
      return sendJson(res, 200, faqResult);
    }

    // 7. Ruta no encontrada
    return sendJson(res, 404, {
      timestamp: new Date().toISOString(),
      status: 404,
      code: "NOT_FOUND",
      message: "Ruta no encontrada.",
      correlationId,
    });
  } catch (error) {
    return sendJson(res, 500, {
      timestamp: new Date().toISOString(),
      status: 500,
      code: "INTERNAL_ERROR",
      message: error instanceof Error ? error.message : "Error inesperado al procesar la solicitud.",
      correlationId: req.headers["x-correlation-id"] ?? randomUUID(),
    });
  }
}

async function readJson(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");

  if (!raw.trim()) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error("El body debe ser JSON valido.");
    error.statusCode = 400;
    throw error;
  }
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(payload, null, 2));
}

async function servePublicFile(pathname, res) {
  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/assets\//, "");
  const fullPath = normalize(join(publicDir, relativePath));

  const lowerFullPath = fullPath.toLowerCase();
  const lowerPublicDir = publicDir.toLowerCase();

  // Validación robusta para Windows y Unix (case-insensitive para rutas de archivo)
  if (!lowerFullPath.startsWith(lowerPublicDir)) {
    return sendJson(res, 403, {
      timestamp: new Date().toISOString(),
      status: 403,
      code: "FORBIDDEN",
      message: "Archivo no permitido.",
      correlationId: randomUUID(),
    });
  }

  try {
    const content = await readFile(fullPath);
    res.writeHead(200, {
      "content-type": contentType(fullPath),
    });
    res.end(content);
  } catch {
    return sendJson(res, 404, {
      timestamp: new Date().toISOString(),
      status: 404,
      code: "NOT_FOUND",
      message: "Archivo no encontrado.",
      correlationId: randomUUID(),
    });
  }
}

function contentType(pathname) {
  switch (extname(pathname)) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "text/javascript; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}
