/**
 * ============================================================================
 * MODELO DE DATOS: ERRORES DE LA API (API ERROR)
 * ============================================================================
 * 
 * Este archivo define la estructura de datos que tendrá toda respuesta de error
 * que sea devuelta por los endpoints del chatbot en situaciones de fallo.
 */

/**
 * Interface ApiError
 * Define la estructura JSON estándar para respuestas de error de la API.
 */
export interface ApiError {
  timestamp: string;       // Fecha y hora en formato ISO 8601 en que ocurrió el error
  status: number;          // Código de estado HTTP del error (ej. 400, 401, 404, 503)
  code: string;            // Identificador de error codificado (ej. "INVALID_REQUEST", "UNAUTHORIZED")
  message: string;         // Mensaje amigable explicando la razón del fallo
  correlationId: string | null; // ID único de trazabilidad para auditar la petición
}
