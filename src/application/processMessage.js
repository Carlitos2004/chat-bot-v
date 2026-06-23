import { randomUUID } from "node:crypto";
import { callGemini } from "../infrastructure/geminiClient.js";
import { getAdapters } from "../infrastructure/apiAdapters.js";
import { appendMessage } from "../infrastructure/sessionStore.js";
import { detectIntent, extractEntities } from "./intentDetector.js";
import { buildFallbackResponse, buildGeminiPrompt } from "./responseBuilder.js";
import { config } from "../config.js";

const PERSONAL_INTENTS = new Set([
  "order_status",
  "payment_status",
  "shipping_status",
  "notifications",
]);

export async function processMessage({ body, headers }) {
  const correlationId = headers["x-correlation-id"] || randomUUID();
  const sessionId = body?.session_id;
  const message = body?.message;
  const userId = body?.context?.user_id ?? null;

  if (!sessionId || typeof sessionId !== "string") {
    return errorResponse(400, "INVALID_REQUEST", "El campo 'session_id' es requerido.", correlationId);
  }

  if (!message || typeof message !== "string" || !message.trim()) {
    return errorResponse(400, "INVALID_REQUEST", "El campo 'message' es requerido y no puede estar vacio.", correlationId);
  }

  const intent = detectIntent(message);
  const entities = extractEntities(message);

  appendMessage(sessionId, {
    role: "user",
    content: message,
    intent_detected: null,
    timestamp: new Date().toISOString(),
  });

  if (PERSONAL_INTENTS.has(intent) && !userId) {
    const response = "Para consultar informacion personal necesitas iniciar sesion.";

    appendMessage(sessionId, {
      role: "assistant",
      content: response,
      intent_detected: intent,
      timestamp: new Date().toISOString(),
    });

    return errorResponse(401, "UNAUTHORIZED", response, correlationId);
  }

  try {
    const context = await collectContext({
      intent,
      entities,
      userId,
      headers,
      correlationId,
    });

    const fallback = buildFallbackResponse({ intent, context, entities });
    const geminiText = await maybeGenerateWithGemini({ message, intent, context, fallback });
    const response = geminiText || fallback;
    const timestamp = new Date().toISOString();

    appendMessage(sessionId, {
      role: "assistant",
      content: response,
      intent_detected: intent,
      timestamp,
    });

    return {
      statusCode: 200,
      payload: {
        session_id: sessionId,
        response,
        intent_detected: intent,
        sources_consulted: context.sources,
        correlation_id: correlationId,
        timestamp,
      },
    };
  } catch (error) {
    return errorResponse(
      503,
      "UPSTREAM_SERVICE_UNAVAILABLE",
      error instanceof Error ? error.message : "Un servicio externo no esta disponible en este momento.",
      correlationId,
    );
  }
}

async function collectContext({ intent, entities, userId, headers, correlationId }) {
  const adapters = getAdapters({ headers, correlationId });

  switch (intent) {
    case "order_status": {
      const order = await adapters.orders.getOrder(entities.orderId, userId);
      return { sources: ["order-service"], order };
    }

    case "payment_status": {
      const order = await adapters.orders.getOrder(entities.orderId, userId);
      const payment = await adapters.payments.getPaymentByOrderId(order.id);
      return { sources: ["order-service", "payment-service"], order, payment };
    }

    case "shipping_status": {
      const order = await adapters.orders.getOrder(entities.orderId, userId);
      const shipment = await adapters.shipping.getShipmentByOrderId(order.id);
      return { sources: ["order-service", "shipping-service"], order, shipment };
    }

    case "product_info": {
      const product = await adapters.catalog.findProduct(entities.productQuery);
      return { sources: ["catalog-service"], product };
    }

    case "stock_info": {
      const product = await adapters.catalog.findProduct(entities.productQuery);
      const inventory = await adapters.inventory.getInventory(product.id);
      return { sources: ["catalog-service", "inventory-service"], product, inventory };
    }

    case "notifications": {
      const notifications = await adapters.notifications.getNotifications(userId);
      return { sources: ["notification-service"], notifications };
    }

    case "faq":
    case "unknown":
    default:
      return { sources: [], faq: true };
  }
}

async function maybeGenerateWithGemini({ message, intent, context, fallback }) {
  if (!config.gemini.enabled || !config.gemini.apiKey) {
    return "";
  }

  const prompt = buildGeminiPrompt({ message, intent, context, fallback });

  try {
    return await callGemini(prompt);
  } catch (error) {
    console.warn("Gemini unavailable, using fallback response:", error.message);
    return "";
  }
}

function errorResponse(statusCode, error, message, correlationId) {
  return {
    statusCode,
    payload: {
      error,
      message,
      correlation_id: correlationId,
    },
  };
}
