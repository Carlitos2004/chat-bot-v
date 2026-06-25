/**
 * ============================================================================
 * ROUTER / ENDPOINT DE SALUD (HEALTH CHECK)
 * ============================================================================
 * 
 * Este archivo define el endpoint encargado de reportar el estado operativo
 * del chatbot y de todos los microservicios del ecosistema con los que se conecta.
 */

import { Router } from "express";
import { getHealth } from "../controllers/health.controller.js";

const router = Router();

/**
 * ENDPOINT: GET /health
 * 
 * - Tipo: Público (No requiere autenticación X-Api-Key).
 * - Función: Retorna el estado del servicio y de sus dependencias (Gemini, catálogos, pedidos, etc.).
 * - Controlador: getHealth en health.controller.ts
 */
router.get("/health", getHealth);

export default router;
