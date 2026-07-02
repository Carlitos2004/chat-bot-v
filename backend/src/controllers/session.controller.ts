import { Request, Response } from "express";
import { getSession } from "../services/sessionStore.service.js";

export async function getSessionHistory(req: Request, res: Response) {
  const correlationId =
    (req.headers["x-correlation-id"] as string) ||
    (req.headers["x-request-id"] as string) ||
    "";
  // Soportamos tanto 'session_id' (contrato OpenAPI) como 'sessionId' (camelCase)
  const sessionId = req.params.session_id || req.params.sessionId;

  if (!sessionId) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      code: "MISSING_SESSION_ID",
      message: "Se requiere el parámetro session_id en la ruta.",
      correlationId: correlationId || null,
    });
  }

  const session = await getSession(sessionId);

  if (!session) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      code: "SESSION_NOT_FOUND",
      message: "No existe una sesión de conversación activa registrada en la memoria o base de datos para el identificador (session_id) proporcionado. Recuerda iniciar la conversación enviando primero un mensaje usando POST /chat/message.",
      correlationId: correlationId || null,
    });
  }

  return res.status(200).json(session);
}
