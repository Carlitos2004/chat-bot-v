import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { processMessage } from "./application/processMessage.js";
import { getSession } from "./infrastructure/sessionStore.js";

const publicDir = fileURLToPath(new URL("../public", import.meta.url));

export async function handleRequest(req, res) {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

    if (req.method === "GET" && (url.pathname === "/" || url.pathname.startsWith("/assets/"))) {
      return servePublicFile(url.pathname, res);
    }

    if (req.method === "GET" && url.pathname === "/health") {
      return sendJson(res, 200, {
        status: "ok",
        service: "chatbot-service",
        timestamp: new Date().toISOString(),
      });
    }

    if (req.method === "POST" && url.pathname === "/chat/message") {
      const body = await readJson(req);
      const result = await processMessage({
        body,
        headers: req.headers,
      });

      return sendJson(res, result.statusCode, result.payload);
    }

    const sessionMatch = url.pathname.match(/^\/chat\/session\/([^/]+)$/);
    if (req.method === "GET" && sessionMatch) {
      const sessionId = decodeURIComponent(sessionMatch[1]);
      const session = getSession(sessionId);

      if (!session) {
        return sendJson(res, 404, {
          error: "SESSION_NOT_FOUND",
          message: "No existe una sesion con el ID proporcionado.",
          correlation_id: req.headers["x-correlation-id"] ?? randomUUID(),
        });
      }

      return sendJson(res, 200, session);
    }

    return sendJson(res, 404, {
      error: "NOT_FOUND",
      message: "Ruta no encontrada.",
      correlation_id: req.headers["x-correlation-id"] ?? randomUUID(),
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: "INTERNAL_ERROR",
      message: error instanceof Error ? error.message : "Error inesperado al procesar la solicitud.",
      correlation_id: req.headers["x-correlation-id"] ?? randomUUID(),
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

  if (!fullPath.startsWith(publicDir)) {
    return sendJson(res, 403, {
      error: "FORBIDDEN",
      message: "Archivo no permitido.",
      correlation_id: randomUUID(),
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
      error: "NOT_FOUND",
      message: "Archivo no encontrado.",
      correlation_id: randomUUID(),
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
