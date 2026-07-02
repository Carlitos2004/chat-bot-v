/**
 * ============================================================================
 * ROUTER / ENDPOINT DE CONVERSACIÓN (CHAT INTERACTIVO)
 * ============================================================================
 * * Este archivo define el endpoint principal que procesa los mensajes enviados
 * por los usuarios en lenguaje natural y genera respuestas a través de Gemini/Mocks.
 */

import { Router } from "express";
import { getSessionHistory } from "../controllers/session.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// GET /chat/session/{session_id} - Obtener historial de chat (Contrato OpenAPI)
router.get("/chat/session/:session_id", authMiddleware, getSessionHistory);

// GET /chat/sessions/{sessionId} - Alias por compatibilidad
router.get("/chat/sessions/:sessionId", authMiddleware, getSessionHistory);

export default router;