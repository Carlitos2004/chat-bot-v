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
      message: "Se requiere el header X-Api-Key para acceder a este servicio.",
      correlationId: correlationId || null,
    });
  }

  if (apiKey !== validApiKey) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      status: 401,
      code: "INVALID_API_KEY",
      message: "La API Key proporcionada no es válida.",
      correlationId: correlationId || null,
    });
  }

  next();
}
