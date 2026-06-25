/**
 * ============================================================================
 * MODELO DE DATOS: CHAT (MENSAJES Y SESIONES)
 * ============================================================================
 * 
 * En TypeScript, definimos "interfaces" y "tipos" para documentar y obligar
 * al código a seguir la estructura de datos que exige el contrato de la API.
 */

/**
 * Rol del emisor del mensaje en el chat.
 * - 'user': El cliente final que envía la consulta.
 * - 'assistant': El bot de soporte que responde (Gemini o respuesta local).
 */
export type MessageRole = "user" | "assistant";

/**
 * Interface Message
 * Representa un mensaje individual enviado o recibido.
 */
export interface Message {
  role: MessageRole;       // Quién envía ('user' o 'assistant')
  content: string;         // El texto del mensaje enviado
  intent_detected: string | null; // El intent detectado (solo para el asistente)
  timestamp: string;       // Marca de tiempo en formato ISO 8601 (ej. "2026-06-25T19:00:00Z")
}

/**
 * Estado actual de la sesión del chat.
 * - 'active': El chat está abierto y respondiendo.
 * - 'closed': El chat ha sido finalizado.
 */
export type SessionStatus = "active" | "closed";

/**
 * Interface Session
 * Representa una conversación completa e incluye el historial de mensajes de la misma.
 */
export interface Session {
  session_id: string;      // Identificador único (UUID) del chat
  user_id: string | null;  // ID del usuario autenticado (null si es anónimo)
  status: SessionStatus;   // Estado de la sesión ('active' o 'closed')
  messages: Message[];     // Historial ordenado cronológicamente de mensajes
}

/**
 * FACTORY: createMessage
 * Función de utilidad para crear y retornar un objeto 'Message' de forma estandarizada.
 * 
 * @param role Rol del emisor
 * @param content Contenido del mensaje
 * @param intent Intent detectado (opcional, por defecto null)
 * @returns Objeto de tipo Message
 */
export function createMessage(
  role: MessageRole,
  content: string,
  intent: string | null = null
): Message {
  return {
    role,
    content,
    intent_detected: intent,
    timestamp: new Date().toISOString(),
  };
}

/**
 * FACTORY: createSession
 * Función de utilidad para inicializar una nueva conversación vacía con estado 'active'.
 * 
 * @param sessionId UUID para identificar la sesión
 * @param userId ID del usuario si está autenticado (opcional)
 * @returns Objeto de tipo Session
 */
export function createSession(
  sessionId: string,
  userId: string | null = null
): Session {
  return {
    session_id: sessionId,
    user_id: userId,
    status: "active",
    messages: [],
  };
}
