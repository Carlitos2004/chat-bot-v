import { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { config } from "../config/config.js";
import { callGemini } from "../services/gemini.service.js";
import { getAdapters } from "../services/upstreamMocks.service.js";
import { appendMessage } from "../services/sessionStore.service.js";
import { detectIntent, extractEntities } from "../services/intent.service.js";
import { getFaq } from "../services/faq.service.js";

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
    "Responde en español claro, breve y util.",
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
    case "order_status": {
      if (!context.order) {
        return `No pudimos encontrar ningún pedido con el número ${entities.orderId}.`;
      }
      const reqId = entities.orderId;
      const retId = context.order.orderId || context.order.id;
      if (reqId !== retId) {
        return `El pedido ${reqId} no existe en el sistema de pedidos. Como simulación de pruebas, te muestro la información del pedido de demostración ${retId}: se encuentra en estado ${context.order.status} por un total de $${context.order.totalAmount}.`;
      }
      return `Tu pedido ${retId} esta ${context.order.status}. Total: $${context.order.totalAmount}.`;
    }

    case "payment_status": {
      if (!context.order) {
        return `No pudimos encontrar ningún pedido con el número ${entities.orderId} para verificar su pago.`;
      }
      const reqId = entities.orderId;
      const retId = context.order.orderId || context.order.id;
      if (reqId !== retId) {
        const paymentStatus = context.payment?.status ?? "PENDIENTE";
        const paymentAmount = context.payment?.amount ?? 0;
        return `El pedido ${reqId} no existe. Como simulación para el pedido ${retId}, el pago se encuentra en estado ${paymentStatus} por un monto de $${paymentAmount}.`;
      }
      if (!context.payment) {
        return `No se encontró información de pago para el pedido ${retId}.`;
      }
      return `El pago del pedido ${retId} esta ${context.payment.status}. Monto: $${context.payment.amount}.`;
    }

    case "shipping_status": {
      if (!context.order) {
        return `No pudimos encontrar ningún pedido con el número ${entities.orderId} para verificar su envío.`;
      }
      const reqId = entities.orderId;
      const retId = context.order.orderId || context.order.id;
      if (reqId !== retId) {
        const trackingNum = context.shipment?.trackingNumber ?? "SIN-TRACKING";
        const shippingStatus = context.shipment?.status ?? "PENDIENTE";
        return `El pedido ${reqId} no existe. Como simulación para el pedido ${retId}, se encuentra en estado logístico ${shippingStatus} (Tracking: ${trackingNum}).`;
      }
      if (!context.shipment) {
        return `No se encontró información de envío para el pedido ${retId}.`;
      }
      return `Tu pedido ${retId} esta en estado logistico ${context.shipment.status}. Tracking: ${context.shipment.trackingNumber}. ETA: ${context.shipment.eta}.`;
    }

    case "product_info":
      if (!context.product) {
        return `No pudimos encontrar información del producto ${entities.productQuery}.`;
      }
      return `${context.product.name}: ${context.product.description}. Precio: $${context.product.price}.`;

    case "stock_info":
      if (!context.product) {
        return `No pudimos verificar el stock porque el producto ${entities.productQuery} no existe en el catálogo.`;
      }
      return context.inventory.available
        ? `Si, ${context.product.name} esta disponible. Quedan ${context.inventory.quantity} unidades.`
        : `Por ahora ${context.product.name} no tiene stock disponible`;

    case "notifications":
      if (!context.notifications.length) {
        return "No tienes notificaciones pendientes";
      }
      return `Tienes ${context.notifications.length} notificacion(es): ${context.notifications
        .map((item: any) => item.title)
        .join("; ")}.`;

    case "faq_envios":
    case "faq_pagos":
    case "faq_cuenta":
    case "faq_productos":
      return "Puedes encontrar más información sobre este tema en nuestra sección de Preguntas Frecuentes.";

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
  const isMock = config.mockMode;

  const getSource = (serviceName: string, url: string) =>
    (!isMock && url) ? serviceName : `${serviceName} (simulado)`;

  switch (intent) {
    case "order_status": {
      // 1. Buscamos el pedido en G5
      const order = await adapters.orders.getOrder(
        entities.orderId,
        userId || ""
      );

      // 2. ¡NUEVO! Si el pedido existe y tiene productos, buscamos sus nombres en el Catálogo
      if (order && order.items && order.items.length > 0) {
        for (let item of order.items) {
          try {
            // Usamos tu adaptador de catálogo para buscar por el ID del producto
            const productInfo = await adapters.catalog.findProduct(item.product_id);
            if (productInfo && (productInfo.name || productInfo.title)) {
              // Le inyectamos una nueva variable al JSON para que Gemini la lea
              item.product_name = productInfo.name || productInfo.title;
            }
          } catch (error) {
            console.warn(`No se pudo obtener el nombre del producto ${item.product_id} del catálogo`);
          }
        }
      }

      return {
        sources: [getSource("Pedidos", config.services.order)],
        order,
      };
    }

    case "shipping_status": {
      const order = await adapters.orders.getOrder(
        entities.orderId,
        userId || ""
      );
      const shipment = order
        ? await adapters.shipping.getShipmentByOrderId(order.orderId || order.id)
        : null;
      return {
        sources: [
          getSource("Pedidos", config.services.order),
          getSource("Envíos", config.services.shipping),
        ],
        order,
        shipment,
      };
    }

    case "product_info": {
      const product = await adapters.catalog.findProduct(
        entities.productQuery
      );
      return {
        sources: [getSource("Catálogo", config.services.catalog)],
        product,
      };
    }

    case "stock_info": {
      const product = await adapters.catalog.findProduct(
        entities.productQuery
      );
      const inventory = product
        ? await adapters.inventory.getInventory(product.id)
        : { productId: "", quantity: 0, available: false };
      return {
        sources: [
          getSource("Catálogo", config.services.catalog),
          getSource("Inventario", config.services.inventory),
        ],
        product,
        inventory,
      };
    }

    case "notifications": {
      const notifications = await adapters.notifications.getNotifications(
        userId || ""
      );
      return {
        sources: [getSource("Notificaciones", config.services.notification)],
        notifications,
      };
    }

    case "faq_envios":
    case "faq_pagos":
    case "faq_cuenta":
    case "faq_productos": {
      // ¡Aquí el chat va a Supabase a buscar la respuesta real!
      const faqData = await getFaq({ category: intent, correlationId });
      return { 
        sources: ["Base de Datos (FAQs)"], 
        faqs: faqData.items 
      };
    }

    case "unknown":
    default:
      return { sources: [] };
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

function getRequiredServices(intent: string): string[] {
  switch (intent) {
    case "order_status":
      return ["order"];
    case "payment_status":
      return ["order", "payment"];
    case "shipping_status":
      return ["order", "shipping"];
    case "product_info":
      return ["catalog"];
    case "stock_info":
      return ["catalog", "inventory"];
    case "notifications":
      return ["notification"];
    default:
      return [];
  }
}

function isServiceConfigured(serviceName: string): boolean {
  if (config.mockMode) return true;

  switch (serviceName) {
    case "auth": return !!config.services.auth;
    case "catalog": return !!config.services.catalog;
    case "order": return !!config.services.order;
    case "payment": return !!config.services.payment;
    case "inventory": return !!config.services.inventory;
    case "shipping": return !!config.services.shipping;
    case "notification": return !!config.services.notification;
    default: return true;
  }
}

export async function sendMessage(req: Request, res: Response) {
  const correlationId =
    (req.headers["x-correlation-id"] as string) ||
    (req.headers["x-request-id"] as string) ||
    randomUUID();

  console.log(`\n======================= 📥 INICIO DE ACCIÓN / MENSAJE =======================`);

  const sendResponse = (status: number, payload: any) => {
    console.log(`\n======================= 📤 FIN DE ACCIÓN / MENSAJE (HTTP ${status}) =======================\n`);
    return res.status(status).json(payload);
  };

  const {
    session_id: sessionId,
    message,
    context: requestContext,
  } = req.body || {};
  const userId = requestContext?.user_id ?? null;

  if (!sessionId || typeof sessionId !== "string") {
    return sendResponse(400, {
      timestamp: new Date().toISOString(),
      status: 400,
      code: "INVALID_REQUEST",
      message: "El campo 'session_id' es requerido.",
      correlationId,
    });
  }

  if (!message || typeof message !== "string" || !message.trim()) {
    return sendResponse(400, {
      timestamp: new Date().toISOString(),
      status: 400,
      code: "INVALID_REQUEST",
      message: "El campo 'message' es requerido y no puede estar vacio.",
      correlationId,
    });
  }

  const intent = detectIntent(message);
  const entities = extractEntities(message);

  console.log(`\n┌── 🤖 [CLASIFICACIÓN DE INTENTO - GEMINI] ─────────────────────────┐`);
  console.log(`│  Mensaje: "${message}"`);
  console.log(`│  Intento Detectado: ${intent}`);
  console.log(`│  Entidades: ${JSON.stringify(entities)}`);
  console.log(`│  Correlation ID: ${correlationId}`);
  console.log(`└───────────────────────────────────────────────────────────────────┘`);

  await appendMessage(sessionId, {
    role: "user",
    content: message,
    intent_detected: null,
    timestamp: new Date().toISOString(),
    user_id: userId,
  });

  if (PERSONAL_INTENTS.has(intent) && !userId) {
    const errorResponseText =
      "Para consultar informacion personal necesitas iniciar sesion.";

    await appendMessage(sessionId, {
      role: "assistant",
      content: errorResponseText,
      intent_detected: intent,
      timestamp: new Date().toISOString(),
    });

    return sendResponse(401, {
      timestamp: new Date().toISOString(),
      status: 401,
      code: "UNAUTHORIZED",
      message: errorResponseText,
      correlationId,
    });
  }

  const required = getRequiredServices(intent);
  const missing = required.filter(s => !isServiceConfigured(s));

  if (missing.length > 0) {
    const serviceNamesMap: Record<string, string> = {
      auth: "Autenticación",
      catalog: "Catálogo",
      order: "Pedidos",
      payment: "Pagos",
      inventory: "Inventario",
      shipping: "Envíos",
      notification: "Notificaciones"
    };
    const active = required.filter(s => isServiceConfigured(s));
    
    let responseText = "";
    if (active.length > 0) {
      const activeNames = active.map(s => serviceNamesMap[s] || s).join(" y ");
      const missingNames = missing.map(s => serviceNamesMap[s] || s).join(" y ");
      responseText = `El módulo de ${activeNames} está activo, pero este apartado está inactivo porque requiere también el módulo de ${missingNames}, el cual no está configurado.`;
    } else {
      const missingNames = missing.map(s => serviceNamesMap[s] || s).join(" y ");
      responseText = `Este apartado está inactivo porque requiere el módulo de ${missingNames}, el cual no está configurado.`;
    }
    const timestamp = new Date().toISOString();

    await appendMessage(sessionId, {
      role: "assistant",
      content: responseText,
      intent_detected: intent,
      timestamp,
    });

    const sourcesConsulted = [
      ...active.map(s => serviceNamesMap[s] || s),
      ...missing.map(s => `${serviceNamesMap[s] || s} (inactivo)`)
    ];

    return sendResponse(200, {
      session_id: sessionId,
      response: responseText,
      intent_detected: intent,
      sources_consulted: sourcesConsulted,
      correlation_id: correlationId,
      timestamp,
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
      // Pass correlationId as well if required
    } as any);
    const response = geminiText || fallback;
    const timestamp = new Date().toISOString();

    await appendMessage(sessionId, {
      role: "assistant",
      content: response,
      intent_detected: intent,
      timestamp,
    });

    return sendResponse(200, {
      session_id: sessionId,
      response,
      intent_detected: intent,
      sources_consulted: context.sources,
      correlation_id: correlationId,
      timestamp,
    });
  } catch (error: any) {
    return sendResponse(503, {
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