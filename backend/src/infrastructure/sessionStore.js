/**
 * @fileoverview Almacén de sesiones en memoria.
 *
 * Base de datos simulada para el funcionamiento del Mock (E2).
 * Equivalente a `sessionsDb` en chatbot-service-main/src/infrastructure/mock_database.ts.
 *
 * Persistencia objetivo (E3): Supabase PostgreSQL.
 *
 * @see models/Session.js
 * @see models/Message.js
 */

import { createSession } from "../models/Session.js";
import { createMessage } from "../models/Message.js";

/**
 * Base de datos de sesiones en memoria.
 * Clave: session_id (string UUID). Valor: Session.
 *
 * @type {Record<string, import('../models/Session.js').Session>}
 */
const sessions = {};

/**
 * Retorna una sesión existente por su ID.
 *
 * @param {string} sessionId - UUID de la sesión.
 * @returns {import('../models/Session.js').Session | null}
 */
export function getSession(sessionId) {
  return sessions[sessionId] || null;
}

/**
 * Agrega un mensaje al historial de una sesión.
 * Si la sesión no existe, la crea automáticamente.
 *
 * @param {string}      sessionId - UUID de la sesión.
 * @param {'user' | 'assistant'} role    - Rol del emisor.
 * @param {string}      content   - Texto del mensaje.
 * @param {string|null} [intent]  - Intent detectado (solo asistente).
 * @param {string|null} [userId]  - ID del usuario (para nueva sesión).
 */
export function appendMessage(sessionId, { role, content, intent_detected, timestamp, user_id }) {
  if (!sessions[sessionId]) {
    sessions[sessionId] = createSession(sessionId, user_id ?? null);
  }

  const msg = createMessage(role, content, intent_detected ?? null);

  // Respetar timestamp externo si ya viene calculado (para consistencia)
  if (timestamp) {
    msg.timestamp = timestamp;
  }

  sessions[sessionId].messages.push(msg);
}

/**
 * Retorna todas las sesiones activas (útil para debugging en desarrollo).
 *
 * @returns {Record<string, import('../models/Session.js').Session>}
 */
export function getAllSessions() {
  return sessions;
}
