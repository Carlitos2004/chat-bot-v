/**
 * @fileoverview Modelo de datos: Session
 *
 * Representa una sesión de conversación completa entre un usuario
 * y el chatbot de soporte (Grupo 11 — Mini Marketplace Cloud).
 *
 * Origen: adaptado de chatbot-service-main/src/infrastructure/mock_database.ts
 * (versión TypeScript del equipo — E2 Mock).
 *
 * Persistencia actual: en memoria (sessionStore.js).
 * Persistencia objetivo (E3): Supabase PostgreSQL.
 */

/**
 * @typedef {import('./Message.js').Message} Message
 */

/**
 * @typedef {'active' | 'closed'} SessionStatus
 * Estado de la sesión.
 * - `active`: sesión en curso, acepta mensajes.
 * - `closed`: sesión cerrada (uso futuro para E3/E4).
 */

/**
 * @typedef {Object} Session
 * @property {string}        session_id - UUID único de la sesión de conversación.
 * @property {string | null} user_id    - ID del usuario autenticado. Null si es anónimo.
 * @property {'active' | 'closed'} status - Estado actual de la sesión.
 * @property {Message[]}     messages   - Historial cronológico de mensajes (user + assistant).
 *
 * @example
 * {
 *   session_id: "550e8400-e29b-41d4-a716-446655440000",
 *   user_id: "USR-01",
 *   status: "active",
 *   messages: [
 *     {
 *       role: "user",
 *       content: "¿Dónde está mi pedido ORD-1001?",
 *       intent_detected: null,
 *       timestamp: "2026-06-24T21:00:00.000Z"
 *     },
 *     {
 *       role: "assistant",
 *       content: "Tu pedido ORD-1001 está EN TRÁNSITO.",
 *       intent_detected: "shipping_status",
 *       timestamp: "2026-06-24T21:00:01.000Z"
 *     }
 *   ]
 * }
 */

/**
 * Crea una nueva sesión vacía con estado `active`.
 *
 * @param {string}        sessionId - UUID de la sesión.
 * @param {string | null} [userId]  - ID del usuario (opcional, null si anónimo).
 * @returns {Session}
 */
export function createSession(sessionId, userId = null) {
  return {
    session_id: sessionId,
    user_id: userId,
    status: "active",
    messages: [],
  };
}
