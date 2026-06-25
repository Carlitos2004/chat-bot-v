/**
 * @fileoverview Modelo de datos: Message
 *
 * Representa un mensaje individual dentro de una sesión de conversación
 * del chatbot de soporte (Grupo 11 — Mini Marketplace Cloud).
 *
 * Origen: adaptado de chatbot-service-main/src/infrastructure/mock_database.ts
 * (versión TypeScript del equipo — E2 Mock).
 */

/**
 * @typedef {'user' | 'assistant'} MessageRole
 * Rol del emisor del mensaje.
 * - `user`: mensaje enviado por el usuario.
 * - `assistant`: respuesta generada por el chatbot (Gemini o fallback).
 */

/**
 * @typedef {Object} Message
 * @property {'user' | 'assistant'} role           - Quién envió el mensaje.
 * @property {string}               content        - Texto del mensaje.
 * @property {string | null}        intent_detected - Intent clasificado (solo en mensajes del asistente).
 * @property {string}               timestamp       - Fecha y hora en formato ISO 8601 (UTC).
 *
 * @example
 * // Mensaje del usuario
 * {
 *   role: "user",
 *   content: "¿Dónde está mi pedido ORD-1001?",
 *   intent_detected: null,
 *   timestamp: "2026-06-24T21:00:00.000Z"
 * }
 *
 * @example
 * // Respuesta del asistente
 * {
 *   role: "assistant",
 *   content: "Tu pedido ORD-1001 está EN TRÁNSITO. Tracking: TRK-CL-1001.",
 *   intent_detected: "shipping_status",
 *   timestamp: "2026-06-24T21:00:01.000Z"
 * }
 */

/**
 * Crea un nuevo objeto Message con los campos requeridos.
 *
 * @param {'user' | 'assistant'} role    - Rol del emisor.
 * @param {string}               content - Texto del mensaje.
 * @param {string | null}        [intent] - Intent detectado (solo asistente). Por defecto null.
 * @returns {Message}
 */
export function createMessage(role, content, intent = null) {
  return {
    role,
    content,
    intent_detected: intent,
    timestamp: new Date().toISOString(),
  };
}
