/**
 * @fileoverview Barrel de routers — chatbot-service (Grupo 11)
 *
 * Centraliza y exporta todos los routers del servicio.
 * app.js importa este archivo para despachar las peticiones HTTP
 * sin necesitar conocer la lógica interna de cada endpoint.
 *
 * ── Endpoints disponibles ───────────────────────────────────────────────────
 * 1. POST /chat/message             → chatRouter.js    (requiere X-Api-Key)
 * 2. GET  /chat/session/{id}        → sessionRouter.js (requiere X-Api-Key)
 * 3. GET  /chat/faq/{category}      → faqRouter.js     (requiere X-Api-Key)
 * 4. GET  /health                   → healthRouter.js  (sin autenticación)
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Cada router define:
 * - method: método HTTP (GET, POST, etc.)
 * - path: ruta exacta (string) O pathPattern: regex con grupos de captura
 * - handler: función async que recibe (req, res, correlationId, bodyOrMatch)
 * - requiresApiKey: boolean — si true, app.js valida X-Api-Key antes de despachar
 * - requiresBody: boolean (opcional) — si true, app.js parsea el body antes de despachar
 *
 * Orden de importancia: el primer router que hace match gana.
 */

export { healthRoute } from "./healthRouter.js";
export { chatMessageRoute } from "./chatRouter.js";
export { sessionRoute } from "./sessionRouter.js";
export { faqRoute } from "./faqRouter.js";

/**
 * Lista ordenada de rutas. app.js itera este array para el dispatch.
 * El orden importa: rutas más específicas primero.
 */
export { healthRoute as routes } from "./healthRouter.js";

import { healthRoute } from "./healthRouter.js";
import { chatMessageRoute } from "./chatRouter.js";
import { sessionRoute } from "./sessionRouter.js";
import { faqRoute } from "./faqRouter.js";

/**
 * @type {Array<{
 *   method: string,
 *   path?: string,
 *   pathPattern?: RegExp,
 *   handler: Function,
 *   requiresApiKey: boolean,
 *   requiresBody?: boolean
 * }>}
 */
export const allRoutes = [
  healthRoute,
  chatMessageRoute,
  sessionRoute,
  faqRoute,
];
