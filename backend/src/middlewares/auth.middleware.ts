import { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    user_id: string;
    business_user_id: string | null;
    email: string;
    role: "customer" | "admin";
    status: "active" | "disabled";
  } | null;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  // Extraer los headers de trazabilidad requeridos
  const correlationId =
    (req.headers["x-correlation-id"] as string) ||
    (req.headers["x-request-id"] as string) ||
    "";
  const requestId = (req.headers["x-request-id"] as string) || "";

  // =========================================================================
  // CAPA 1: Validación de Aplicación (X-Api-Key) - REQUERIDA SIEMPRE
  // =========================================================================
  const apiKeyHeader = req.headers["x-api-key"] as string;
  const EXPECTED_API_KEY = process.env.CHATBOT_API_KEY || "mk-chatbot-abc123xyz"; // Valor por defecto de tu Postman

  // A. Si no viene el header X-Api-Key
  if (!apiKeyHeader) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      status: 401,
      code: "MISSING_API_KEY",
      message: "Se requiere el header X-Api-Key para acceder a este servicio.",
      correlationId: correlationId || null,
    });
  }

  // B. Si la API Key es incorrecta
  if (apiKeyHeader !== EXPECTED_API_KEY) {
    return res.status(401).json({
      timestamp: new Date().toISOString(),
      status: 401,
      code: "INVALID_API_KEY",
      message: "La API Key proporcionada no es válida.",
      correlationId: correlationId || null,
    });
  }


  // =========================================================================
  // CAPA 2: Validación de Usuario (Authorization JWT) - OPCIONAL EN MIDDLEWARE
  // =========================================================================
  const authHeader = req.headers["authorization"];

  // Si no viene Authorization, dejamos pasar la petición (req.user será undefined/null)
  // Tu controlador (chat.controller.ts) decidirá si la bloquea o no dependiendo del intent detectado por Gemini.
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null; 
    return next();
  }

  // Si SÍ viene un token, estamos obligados a validarlo con G2
  const token = authHeader.split(" ")[1];
  const G2_URL = process.env.G2_AUTH_URL || "https://auth-minimarket-cloud.onrender.com";

  try {
    const response = await fetch(`${G2_URL}/auth/validate`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Request-Id": requestId,
        "X-Correlation-Id": correlationId,
        "X-Consumer": "chatbot-service",
      },
    });

    const data = await response.json();

    // Si G2 rechaza el token (401 Expirado/Inválido o 403 Cuenta Deshabilitada)
    if (!response.ok) {
      return res.status(response.status).json({
        timestamp: new Date().toISOString(),
        status: response.status,
        code: data.code || "UNAUTHORIZED",
        message: data.message || "El token proporcionado no es válido o ha expirado.",
        correlationId: correlationId || null,
      });
    }

    // Si el token es válido, inyectamos el usuario
    req.user = {
      user_id: data.user_id,
      business_user_id: data.business_user_id,
      email: data.email,
      role: data.role,
      status: data.status,
    };

    next();
  } catch (error) {
    return res.status(500).json({
      timestamp: new Date().toISOString(),
      status: 500,
      code: "INTERNAL_SERVER_ERROR",
      message: "No se pudo conectar con el servicio de autenticación de G2.",
      correlationId: correlationId || null,
    });
  }
}