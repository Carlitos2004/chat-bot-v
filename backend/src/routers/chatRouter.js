/**
 * @fileoverview Router: POST /chat/message
 *
 * Endpoint conversacional principal del chatbot-service (Grupo 11).
 * Recibe el mensaje del usuario, detecta el intent, consulta los servicios
 * necesarios del ecosistema y devuelve una respuesta en lenguaje natural.
 *
 * Requiere header X-Api-Key válido.
 *
 * Lógica extraída y adaptada de:
 * - backend/src/app.js (proyecto principal)
 * - chatbot-service-main/src/interfaces/chat.router.ts (E2 Mock — TypeScript)
 */

import { processMessage } from "../application/processMessage.js";

/**
 * Intents que requieren user_id autenticado.
 */
const PERSONAL_INTENTS = new Set([
  "order_status",
  "payment_status",
  "shipping_status",
  "notifications",
]);

// ────────────────────────────────────────────────────────────────────────────
// ENDPOINT 1 — POST /chat/message
// Recibe el mensaje del usuario, detecta el intent, consulta los servicios
// del ecosistema (G2, G3, G5, G6, G7, G8, G9) y devuelve la respuesta.
// Requiere X-Api-Key. Si el intent es personal (pedido/pago/despacho/
// notificaciones), también requiere Authorization (JWT del Grupo 2).
// ────────────────────────────────────────────────────────────────────────────

/**
 * Maneja POST /chat/message
 *
 * Flow:
 *  1. Validar body (session_id, message, context)
 *  2. Detectar intent con intentDetector
 *  3. Si intent personal y sin user_id → 401
 *  4. Recopilar contexto de los servicios externos (o mock)
 *  5. Construir respuesta con Gemini o fallback
 *  6. Guardar en sesión y responder
 *
 * @param {import("http").IncomingMessage} req
 * @param {import("http").ServerResponse}  res
 * @param {string} correlationId
 * @param {Object} body - Body JSON ya parseado por app.js
 */
export async function handleChatMessage(req, res, correlationId, body) {
  const result = await processMessage({
    body,
    headers: req.headers,
  });

  return {
    handled: true,
    statusCode: result.statusCode,
    payload: result.payload,
  };
}

/**
 * Definición de ruta para el barrel de routers.
 */
export const chatMessageRoute = {
  method: "POST",
  path: "/chat/message",
  handler: handleChatMessage,
  requiresBody: true,
  requiresApiKey: true,
};
