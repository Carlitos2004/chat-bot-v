/**
 * @fileoverview Request handler principal — chatbot-service (Grupo 11)
 *
 * Recibe todas las peticiones HTTP y las despacha al router correspondiente.
 * La lógica de cada endpoint vive en src/routers/:
 *
 *   GET  /health                   → routers/healthRouter.js
 *   POST /chat/message             → routers/chatRouter.js
 *   GET  /chat/session/{id}        → routers/sessionRouter.js
 *   GET  /chat/faq/{category}      → routers/faqRouter.js
 *
 * Además sirve archivos estáticos del frontend (GET / y /assets/*).
 */

import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { allRoutes } from "./routers/index.js";

// Directorio del frontend (relativo a backend/src/ → frontend/)
const publicDir = fileURLToPath(new URL("../../frontend", import.meta.url));

/**
 * Handler principal — se pasa directamente a http.createServer().
 *
 * @param {import("http").IncomingMessage} req
 * @param {import("http").ServerResponse}  res
 */
export async function handleRequest(req, res) {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const correlationId = req.headers["x-correlation-id"] ?? randomUUID();
    const pathname = url.pathname;
    const method = req.method ?? "GET";

    // ── Archivos estáticos del frontend (sin API Key) ──────────────────────
    if (method === "GET" && (pathname === "/" || pathname.startsWith("/assets/"))) {
      return servePublicFile(pathname, res, correlationId);
    }

    // ── Dispatch a routers ─────────────────────────────────────────────────
    for (const route of allRoutes) {
      // Verificar método HTTP
      if (route.method !== method) continue;

      // Verificar path (exacto) o pathPattern (regex)
      let match = null;
      if (route.path) {
        if (pathname !== route.path) continue;
        match = [pathname]; // mock de RegExpMatchArray para consistencia
      } else if (route.pathPattern) {
        match = pathname.match(route.pathPattern);
        if (!match) continue;
      } else {
        continue;
      }

      // Validar X-Api-Key si el router lo requiere
      if (route.requiresApiKey) {
        const apiKeyError = validateApiKey(req, correlationId);
        if (apiKeyError) return sendJson(res, apiKeyError.statusCode, apiKeyError.payload);
      }

      // Parsear body si el router lo requiere (POST/PUT)
      let body = {};
      if (route.requiresBody) {
        body = await readJson(req);
      }

      // Delegar al handler del router
      const result = await route.handler(req, res, correlationId, route.requiresBody ? body : match);
      return sendJson(res, result.statusCode, result.payload);
    }

    // ── Ruta no encontrada ─────────────────────────────────────────────────
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

// ── Utilidades internas ──────────────────────────────────────────────────────

/**
 * Valida el header X-Api-Key.
 * Retorna null si es válido, o un objeto de error si no.
 *
 * @param {import("http").IncomingMessage} req
 * @param {string} correlationId
 * @returns {{ statusCode: number, payload: object } | null}
 */
function validateApiKey(req, correlationId) {
  const apiKey = req.headers["x-api-key"];
  const validApiKey = process.env.CHATBOT_API_KEY || "mk-chatbot-abc123xyz";

  if (!apiKey) {
    return {
      statusCode: 401,
      payload: {
        timestamp: new Date().toISOString(),
        status: 401,
        code: "MISSING_API_KEY",
        message: "Se requiere el header X-Api-Key para acceder a este servicio.",
        correlationId,
      },
    };
  }

  if (apiKey !== validApiKey) {
    return {
      statusCode: 401,
      payload: {
        timestamp: new Date().toISOString(),
        status: 401,
        code: "INVALID_API_KEY",
        message: "La API Key proporcionada no es válida.",
        correlationId,
      },
    };
  }

  return null;
}

/**
 * Parsea el body JSON de una request.
 *
 * @param {import("http").IncomingMessage} req
 * @returns {Promise<object>}
 */
async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error("El body debe ser JSON valido.");
    error.statusCode = 400;
    throw error;
  }
}

/**
 * Envía una respuesta JSON.
 *
 * @param {import("http").ServerResponse} res
 * @param {number} statusCode
 * @param {object} payload
 */
function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload, null, 2));
}

/**
 * Sirve archivos estáticos del frontend.
 *
 * @param {string} pathname
 * @param {import("http").ServerResponse} res
 * @param {string} correlationId
 */
async function servePublicFile(pathname, res, correlationId) {
  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/assets\//, "");
  const fullPath = normalize(join(publicDir, relativePath));

  // Validación de path traversal (Windows + Unix)
  if (!fullPath.toLowerCase().startsWith(publicDir.toLowerCase())) {
    return sendJson(res, 403, {
      timestamp: new Date().toISOString(),
      status: 403,
      code: "FORBIDDEN",
      message: "Archivo no permitido.",
      correlationId,
    });
  }

  try {
    const content = await readFile(fullPath);
    res.writeHead(200, { "content-type": contentType(fullPath) });
    res.end(content);
  } catch {
    sendJson(res, 404, {
      timestamp: new Date().toISOString(),
      status: 404,
      code: "NOT_FOUND",
      message: "Archivo no encontrado.",
      correlationId,
    });
  }
}

/**
 * Retorna el Content-Type según la extensión del archivo.
 *
 * @param {string} pathname
 * @returns {string}
 */
function contentType(pathname) {
  switch (extname(pathname)) {
    case ".html": return "text/html; charset=utf-8";
    case ".css":  return "text/css; charset=utf-8";
    case ".js":   return "text/javascript; charset=utf-8";
    default:      return "application/octet-stream";
  }
}
