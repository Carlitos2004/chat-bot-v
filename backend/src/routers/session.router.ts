/**
 * ============================================================================
 * ROUTER / ENDPOINT DE HISTORIAL DE SESIONES
 * ============================================================================
 * 
 * Este archivo define el endpoint que permite consultar y recuperar la lista
 * de mensajes (el historial) acumulados dentro de una sesión de conversación específica.
 */

import { Router } from "express";
import { getSessionHistory } from "../controllers/session.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Middleware de seguridad obligatorio: Protege todas las peticiones con X-Api-Key
router.use(authMiddleware);

/**
 * ENDPOINT: GET /chat/session/:sessionId
 * 
 * - Tipo: Privado (Exige el header X-Api-Key).
 * - Función: Busca la sesión en memoria y retorna su objeto completo con el
 *            historial de turnos de usuario y asistente.
 * - Parámetros en URL: sessionId (UUID enviado en el path).
 * - Controlador: getSessionHistory en session.controller.ts
 */
router.get("/chat/session/:sessionId", getSessionHistory);

export default router;
