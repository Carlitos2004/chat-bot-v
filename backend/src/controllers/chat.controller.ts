import { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { config } from "../config/config.js";
import { callGemini } from "../services/gemini.service.js";
import { getAdapters } from "../services/upstreamMocks.service.js";
import { appendMessage } from "../services/sessionStore.service.js";
import { detectIntent, extractEntities } from "../services/intent.service.js";

const PERSONAL_INTENTS = new Set([
  "order_status",
  "payment_status",
  "shipping_status",
  "notifications",
]);

function buildGeminiPrompt({
  message,
  intent,
  context,
  fallback,
}: {
  message: string;
  intent: string;
  context: any;
  fallback: string;
}): string {
  return [
    "Eres el chatbot de soporte del ecosistema Mini Marketplace Cloud.",
    "Responde en espanol claro, breve y util.",
    "No inventes datos. Usa solo el JSON de contexto.",
    "Si falta informacion, dilo de forma amable.",
    "",
    `Mensaje del usuario: ${message}`,
    `Intent detectado: ${intent}`,
    `Contexto JSON: ${JSON.stringify(context)}`,
    `Respuesta fallback esperada si Gemini no mejora nada: ${fallback}`,
  ].join("\n");
}

function buildFallbackResponse({
  intent,
  context,
  entities,
}: {
  intent: string;
  context: any;
  entities: { orderId: string; productQuery: string };
}): string {
  switch (intent) {
    case "order_status":
      return `Tu pedido ${context.order.id} esta ${context.order.status}. Total: $${context.order.totalAmount}.`;

    case "payment_status":
      return `El pago del pedido ${context.order.id} esta ${context.payment.status}. Monto: $${context.payment.amount}.`;

    case "shipping_status":
      return `Tu pedido ${context.order.id} esta en estado logistico ${context.shipment.status}. Tracking: ${context.shipment.trackingNumber}. ETA: ${context.shipment.eta}.`;

    case "product_info":
      return `${context.product.name}: ${context.product.description}. Precio: $${context.product.price}.`;

    case "stock_info":
      return context.inventory.available
        ? `Si, ${context.product.name} esta disponible. Quedan ${context.inventory.quantity} unidades.`
        : `Por ahora ${context.product.name} no tiene stock disponible.`;

    case "notifications":
      if (!context.notifications.length) {
        return "No tienes notificaciones pendientes.";
      }
      return `Tienes ${context.notifications.length} notificacion(es): ${context.notifications
        .map((item: any) => item.title)
        .join("; ")}.`;

    case "faq":
      return "Aceptamos tarjetas de credito, debito y transferencia bancaria. Para pedidos personales debes iniciar sesion.";

    case "unknown":
    default:
      return `Puedo ayudarte con pedidos, pagos, despacho, productos, stock, notificaciones y preguntas frecuentes. Intenta mencionar un numero de pedido como ${entities.orderId}.`;
  }
}

async function collectContext({
  intent,
  entities,
  userId,
  headers,
  correlationId,
}: {
  intent: string;
  entities: { orderId: string; productQuery: string };
  userId: string | null;
  headers: any;
  correlationId: string;
}) {
  const adapters = getAdapters({ headers, correlationId });

  switch (intent) {
    case "order_status": {
      const order = await adapters.orders.getOrder(
        entities.orderId,
        userId || ""
      );
      return { sources: ["order-service"], order };
    }

    case "payment_status": {
      const order = await adapters.orders.getOrder(
        entities.orderId,
        userId || ""
      );
      const payment = await adapters.payments.getPaymentByOrderId(order.id);
      return {
        sources: ["order-service", "payment-service"],
        order,
        payment,
      };
    }

    case "shipping_status": {
      const order = await adapters.orders.getOrder(
        entities.orderId,
        userId || ""
      );
      const shipment = await adapters.shipping.getShipmentByOrderId(order.id);
      return {
        sources: ["order-service", "shipping-service"],
        order,
        shipment,
      };
    }

    case "product_info": {
      const product = await adapters.catalog.findProduct(
        entities.productQuery
      );
      return { sources: ["catalog-service"], product };
    }

    case "stock_info": {
      const product = await adapters.catalog.findProduct(
        entities.productQuery
      );
      const inventory = await adapters.inventory.getInventory(product.id);
      return {
        sources: ["catalog-service", "inventory-service"],
        product,
        inventory,
      };
    }

    case "notifications": {
      const notifications = await adapters.notifications.getNotifications(
        userId || ""
      );
      return { sources: ["notification-service"], notifications };
    }

    case "faq":
    case "unknown":
    default:
      return { sources: [], faq: true };
  }
}

async function maybeGenerateWithGemini({
  message,
  intent,
  context,
  fallback,
}: {
  message: string;
  intent: string;
  context: any;
  fallback: string;
}): Promise<string> {
  if (!config.gemini.enabled || !config.gemini.apiKey) {
    return "";
  }

  const prompt = buildGeminiPrompt({ message, intent, context, fallback });

  try {
    return await callGemini(prompt);
  } catch (error: any) {
    console.warn(
      "Gemini unavailable, using fallback response:",
      error.message
    );
    return "";
  }
}

export async function sendMessage(req: Request, res: Response) {
  const correlationId =
    (req.headers["x-correlation-id"] as string) ||
    (req.headers["x-request-id"] as string) ||
    randomUUID();

  const {
    session_id: sessionId,
    message,
    context: requestContext,
  } = req.body || {};
  const userId = requestContext?.user_id ?? null;

  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      code: "INVALID_REQUEST",
      message: "El campo 'session_id' es requerido.",
      correlationId,
    });
  }

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      code: "INVALID_REQUEST",
      message: "El campo 'message' es requerido y no puede estar vacio.",
      correlationId,
    });
  }

  const intent = detectIntent(message);
  const entities = extractEntities(message);

  appendMessage(sessionId, {
    role: "user",
    content: message,
    intent_detected: null,
    timestamp: new Date().toISOString(),
    user_id: userId,
  });

  if (PERSONAL_INTENTS.has(intent) && !userId) {
    const errorResponseText =
      "Para consultar informacion personal necesitas iniciar sesion.";

    appendMessage(sessionId, {
      role: "assistant",
      content: errorResponseText,
      intent_detected: intent,
      timestamp: new Date().toISOString(),
    });

    return res.status(401).json({
      timestamp: new Date().toISOString(),
      status: 401,
      code: "UNAUTHORIZED",
      message: errorResponseText,
      correlationId,
    });
  }

  try {
    const context = await collectContext({
      intent,
      entities,
      userId,
      headers: req.headers,
      correlationId,
    });

    const fallback = buildFallbackResponse({ intent, context, entities });
    const geminiText = await maybeGenerateWithGemini({
      message,
      intent,
      context,
      fallback,
    });
    const response = geminiText || fallback;
    const timestamp = new Date().toISOString();

    appendMessage(sessionId, {
      role: "assistant",
      content: response,
      intent_detected: intent,
      timestamp,
    });

    return res.status(200).json({
      session_id: sessionId,
      response,
      intent_detected: intent,
      sources_consulted: context.sources,
      correlation_id: correlationId,
      timestamp,
    });
  } catch (error: any) {
    return res.status(503).json({
      timestamp: new Date().toISOString(),
      status: 503,
      code: "UPSTREAM_SERVICE_UNAVAILABLE",
      message:
        error instanceof Error
          ? error.message
          : "Un servicio externo no esta disponible en este momento.",
      correlationId,
    });
  }
}

