/**
 * ============================================================================
 * ROUTER / ENDPOINT DE PREGUNTAS FRECUENTES (FAQ)
 * ============================================================================
 * 
 * Este archivo define el endpoint encargado de recuperar y devolver respuestas
 * a preguntas frecuentes de soporte, agrupadas por categorías predefinidas.
 */

import { Router } from "express";
import { getFaqList } from "../controllers/faq.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Middleware de seguridad obligatorio: Protege todas las peticiones con X-Api-Key

/**
 * ENDPOINT: GET /chat/faq/:category
 * 
 * - Tipo: Privado (Exige el header X-Api-Key).
 * - Función: Retorna preguntas y respuestas sobre una categoría. Si Gemini
 *            está habilitado, las genera dinámicamente; si no, usa el fallback local.
 * - Parámetros en URL: category (faq_envios | faq_pagos | faq_productos | faq_cuenta).
 * - Controlador: getFaqList en faq.controller.ts
 */
router.get("/chat/faq/:category", authMiddleware, getFaqList);

export default router;
