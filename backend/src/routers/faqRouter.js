/**
 * @fileoverview Router: GET /chat/faq/{category}
 *
 * Retorna preguntas frecuentes agrupadas por categoría.
 * Generadas por Gemini si hay API Key configurada, o desde los
 * fallbacks locales en faqService.js si no hay conexión con Gemini.
 *
 * Requiere header X-Api-Key válido.
 *
 * Categorías válidas:
 * - faq_envios   : Tiempos, zonas y seguimiento de despacho
 * - faq_pagos    : Métodos de pago, reembolsos y cuotas
 * - faq_cuenta   : Registro, contraseña y gestión de cuenta
 * - faq_productos: Catálogo, devoluciones y garantías
 *
 * Lógica extraída y adaptada de:
 * - backend/src/app.js (proyecto principal)
 * - chatbot-service-main/src/interfaces/chat.router.ts (E2 Mock — TypeScript)
 */

import { getFaq } from "../application/faqService.js";

/**
 * Patrón de URL para esta ruta.
 * Ejemplo: /chat/faq/faq_pagos
 */
export const FAQ_PATH_PATTERN = /^\/chat\/faq\/([^/]+)$/;

/**
 * Categorías de FAQ aceptadas por el servicio.
 */
export const VALID_FAQ_CATEGORIES = [
  "faq_envios",
  "faq_pagos",
  "faq_cuenta",
  "faq_productos",
];

// ────────────────────────────────────────────────────────────────────────────
// ENDPOINT 3 — GET /chat/faq/{category}
// Retorna preguntas frecuentes agrupadas por categoría. Si Gemini está
// configurado, las genera dinámicamente. Si no, usa los fallbacks locales.
// Categorías: faq_envios | faq_pagos | faq_cuenta | faq_productos
// Requiere X-Api-Key.
// ────────────────────────────────────────────────────────────────────────────

/**
 * Maneja GET /chat/faq/{category}
 *
 * Respuestas:
 * - 200: { category, items: [{question, answer}], generated_at, correlationId }
 * - 400: INVALID_FAQ_CATEGORY — categoría no reconocida
 *
 * @param {import("http").IncomingMessage} req
 * @param {import("http").ServerResponse}  res
 * @param {string} correlationId
 * @param {RegExpMatchArray} match - Resultado del regex con category en el grupo 1
 */
export async function handleGetFaq(req, res, correlationId, match) {
  const category = decodeURIComponent(match[1]);

  if (!VALID_FAQ_CATEGORIES.includes(category)) {
    return {
      handled: true,
      statusCode: 400,
      payload: {
        timestamp: new Date().toISOString(),
        status: 400,
        code: "INVALID_FAQ_CATEGORY",
        message: `La categoría '${category}' no es válida. Use: ${VALID_FAQ_CATEGORIES.join(", ")}.`,
        correlationId,
      },
    };
  }

  const faqResult = await getFaq({ category, correlationId });

  return {
    handled: true,
    statusCode: 200,
    payload: faqResult,
  };
}

/**
 * Definición de ruta para el barrel de routers.
 */
export const faqRoute = {
  method: "GET",
  pathPattern: FAQ_PATH_PATTERN,
  handler: handleGetFaq,
  requiresApiKey: true,
};
