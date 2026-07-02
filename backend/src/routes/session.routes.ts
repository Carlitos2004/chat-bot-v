/**
 * ============================================================================
 * ROUTER / ENDPOINT DE CONVERSACIÓN (CHAT INTERACTIVO)
 * ============================================================================
 * * Este archivo define el endpoint principal que procesa los mensajes enviados
 * por los usuarios en lenguaje natural y genera respuestas a través de Gemini/Mocks.
 */

import { Router } from "express";
import { sendMessage } from "../controllers/chat.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * ENDPOINT: POST /chat
 * * - Tipo: Privado (Exige el header X-Api-Key a nivel de aplicación).
 * - Función: Recibe la pregunta del usuario, detecta la intención, consulta 
 * los datos de microservicios externos y responde.
 * - Parámetros requeridos en Body: session_id (UUID), message (string).
 * - Controlador: sendMessage en chat.controller.ts
 */
router.post("/", authMiddleware, sendMessage);

export default router;