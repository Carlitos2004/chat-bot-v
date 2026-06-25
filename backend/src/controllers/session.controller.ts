import { Request, Response } from "express";
import { getSession } from "../services/sessionStore.service.js";

export function getSessionHistory(req: Request, res: Response) {
  const correlationId =
    (req.headers["x-correlation-id"] as string) ||
    (req.headers["x-request-id"] as string) ||
    "";
  const { sessionId } = req.params;
  const session = getSession(sessionId);

  if (!session) {
    return res.status(404).json({
      timestamp: new Date().toISOString(),
      status: 404,
      code: "SESSION_NOT_FOUND",
      message: "No existe una sesión de conversación activa registrada en la memoria del servidor para el identificador (session_id) proporcionado. Recuerda iniciar la conversación enviando primero un mensaje usando POST /chat/message.",
      correlationId: correlationId || null,
    });
  }

  return res.status(200).json(session);
}
