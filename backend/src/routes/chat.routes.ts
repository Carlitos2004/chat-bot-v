/**
 * ============================================================================
 * ROUTER / ENDPOINT DE CONVERSACIÓN (CHAT INTERACTIVO)
 * ============================================================================
 * 
 * Este archivo define el endpoint principal que procesa los mensajes enviados
 * por los usuarios en lenguaje natural y genera respuestas a través de Gemini/Mocks.
 */

import { Router } from "express";
import { sendMessage } from "../controllers/chat.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Middleware de seguridad obligatorio: Protege todas las peticiones con X-Api-Key

// POST /chat/message - Enviar mensaje (Contrato OpenAPI)
router.post("/chat/message", authMiddleware, sendMessage);

// POST /chat - Alias por compatibilidad con el frontend visual
router.post("/chat", authMiddleware, sendMessage);

export default router;
