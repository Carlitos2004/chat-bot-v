import { Request, Response, NextFunction } from "express";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const apiKey = req.headers["x-api-key"] as string | undefined;
  const validApiKey = process.env.CHATBOT_API_KEY || "mk-chatbot-abc123xyz";
  const correlationId =
    (req.headers["x-correlation-id"] as string) ||
    (req.headers["x-request-id"] as string) ||
    "";

  if (!apiKey) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      status: 401,
      code: "MISSING_API_KEY",
      message: "Falta la cabecera de seguridad obligatoria: Se requiere incluir el header 'X-Api-Key' para autorizar el acceso a la API del Chatbot.",
      correlationId: correlationId || null,
    });
  }

  if (apiKey !== validApiKey) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      status: 401,
      code: "INVALID_API_KEY",
      message: "La contraseña de acceso ('X-Api-Key') enviada es incorrecta. Verifica que el valor coincida con la API Key configurada en el servidor.",
      correlationId: correlationId || null,
    });
  }

  next();
}
