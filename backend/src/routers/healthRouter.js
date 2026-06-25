/**
 * @fileoverview Router: GET /health
 *
 * Endpoint de salud del chatbot-service.
 * No requiere API Key — disponible públicamente para monitoreo.
 *
 * Responde el estado operativo del servicio y sus dependencias.
 * Compatible con lo implementado en chatbot-service-main/src/app.ts (E2 Mock).
 */

import { config } from "../config.js";

// ────────────────────────────────────────────────────────────────────────────
// ENDPOINT 4 — GET /health
// Verifica que el servicio está levantado y muestra el estado de todas sus
// dependencias (Gemini + servicios de otros grupos).
// NO requiere X-Api-Key — disponible públicamente para monitoreo.
// ────────────────────────────────────────────────────────────────────────────

/**
 * Maneja GET /health
 *
 * @param {import("http").IncomingMessage} req
 * @param {import("http").ServerResponse}  res
 * @param {string} correlationId
 */
export async function handleHealth(req, res, correlationId) {
  const geminiStatus = config.gemini.apiKey ? "ok" : "error";
  const isMock = config.mockMode;

  const dependencyStatus = (url) =>
    url ? "ok" : isMock ? "ok (mock)" : "not_configured";

  return {
    handled: true,
    statusCode: 200,
    payload: {
      status: geminiStatus === "ok" ? "ok" : "degraded",
      version: "1.1",
      mock_mode: isMock,
      dependencies: {
        gemini: geminiStatus,
        auth_service: dependencyStatus(config.services.auth),
        catalog_service: dependencyStatus(config.services.catalog),
        order_service: dependencyStatus(config.services.order),
        payment_service: dependencyStatus(config.services.payment),
        inventory_service: dependencyStatus(config.services.inventory),
        shipment_service: dependencyStatus(config.services.shipping),
        notification_service: dependencyStatus(config.services.notification),
      },
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Definición de ruta para el barrel de routers.
 */
export const healthRoute = {
  method: "GET",
  path: "/health",
  handler: handleHealth,
  requiresApiKey: false,
};
