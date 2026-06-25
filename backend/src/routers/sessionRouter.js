/**
 * @fileoverview Router: GET /chat/session/{session_id}
 *
 * Retorna el historial completo de mensajes de una sesión de conversación.
 * Requiere header X-Api-Key válido.
 *
 * Lógica extraída y adaptada de:
 * - backend/src/app.js (proyecto principal)
 * - chatbot-service-main/src/interfaces/chat.router.ts (E2 Mock — TypeScript)
 *
 * Modelo de datos retornado: Session (ver models/Session.js)
 */

import { getSession } from "../infrastructure/sessionStore.js";

/**
 * Patrón de URL para esta ruta.
 * Ejemplo: /chat/session/550e8400-e29b-41d4-a716-446655440000
 */
export const SESSION_PATH_PATTERN = /^\/chat\/session\/([^/]+)$/;

// ────────────────────────────────────────────────────────────────────────────
// ENDPOINT 2 — GET /chat/session/{session_id}
// Retorna el historial completo de mensajes de una sesión (turnos user +
// assistant). Útil para que el frontend recargue el chat o para debugging.
// Requiere X-Api-Key.
// ────────────────────────────────────────────────────────────────────────────

/**
 * Maneja GET /chat/session/{session_id}
 *
 * Respuestas:
 * - 200: Objeto Session con historial de mensajes
 * - 404: SESSION_NOT_FOUND — no existe sesión con ese ID
 *
 * @param {import("http").IncomingMessage} req
 * @param {import("http").ServerResponse}  res
 * @param {string} correlationId
 * @param {RegExpMatchArray} match - Resultado del regex con session_id en el grupo 1
 */
export async function handleGetSession(req, res, correlationId, match) {
  const sessionId = decodeURIComponent(match[1]);
  const session = getSession(sessionId);

  if (!session) {
    return {
      handled: true,
      statusCode: 404,
      payload: {
        timestamp: new Date().toISOString(),
        status: 404,
        code: "SESSION_NOT_FOUND",
        message: "No existe una sesion con el ID proporcionado.",
        correlationId,
      },
    };
  }

  return {
    handled: true,
    statusCode: 200,
    payload: session,
  };
}

/**
 * Definición de ruta para el barrel de routers.
 */
export const sessionRoute = {
  method: "GET",
  pathPattern: SESSION_PATH_PATTERN,
  handler: handleGetSession,
  requiresApiKey: true,
};
