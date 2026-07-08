import { randomUUID } from "node:crypto";
import { config } from "../config/config.js";

export const mockData = {
  auth: {
    user_id: "",
    role: "customer",
    status: "ACTIVE",
  },
  products: [] as any[],
  inventory: {} as Record<string, { productId: string; quantity: number; available: boolean }>,
  orders: {} as Record<string, any>,
  paymentsByOrderId: {} as Record<string, any>,
  shipmentsByOrderId: {} as Record<string, any>,
  notificationsByUserId: {} as Record<string, any[]>,
};


// =====================================================================
// FIX: evita URLs con doble barra "//" cuando la env var (ej.
// ORDER_SERVICE_URL) viene con "/" al final, como
// "https://pedidos-g5.onrender.com/". Sin esto, Express en el
// servicio externo no matchea la ruta y responde 404, que el
// código interpreta como "no encontrado" en vez de ver el bug real.
// =====================================================================
function joinUrl(base: string, path: string): string {
  let cleanBase = base.replace(/\/+$/, "");
  
  // Limpiar sufijo /health en la URL de despacho si está configurado erróneamente
  if (cleanBase.endsWith("/health")) {
    cleanBase = cleanBase.substring(0, cleanBase.length - 7);
  }
  
  const pathClean = path.replace(/^\/+/, "");
  const pathSegment = pathClean.split('?')[0]; 
  
  const baseParts = cleanBase.split('/');
  const lastBaseSegment = baseParts[baseParts.length - 1]; 
  
  // Evitar duplicaciones de rutas (por ejemplo, /products/products o /payments/payments)
  if (lastBaseSegment === pathSegment) {
    const queryPart = path.includes('?') ? path.substring(path.indexOf('?')) : '';
    return cleanBase + queryPart;
  }
  
  return `${cleanBase}/${pathClean}`;
}

// G5 solo acepta buscar por su UUID interno en GET /orders/{id}.
// Cuando el usuario escribe el "orderNumber" (ej: ORD-1782947531159),
// hay que listar los pedidos del userId y buscar el que coincida.
function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

// Normaliza a camelCase, ya que GET /orders/{id} devuelve camelCase
// pero GET /orders (listado) devuelve snake_case para los mismos campos.
function normalizeOrder(order: any) {
  return {
    ...order,
    id: order.id,
    orderNumber: order.orderNumber ?? order.order_number,
    userId: order.userId ?? order.user_id,
    totalAmount: order.totalAmount ?? order.total_amount,
    createdAt: order.createdAt ?? order.created_at,
    updatedAt: order.updatedAt ?? order.updated_at,
  };
}

// Normalizar la respuesta de envíos del G8 para coincidir con la estructura interna esperada
function normalizeShipment(shipment: any) {
  if (!shipment) return null;
  return {
    ...shipment,
    trackingNumber: shipment.shipmentId || shipment.trackingNumber || "SIN-TRACKING",
    status: shipment.status || "PENDIENTE",
    eta: shipment.deliveredAt ? `Entregado el ${shipment.deliveredAt}` : (shipment.updatedAt ? `Última actualización: ${shipment.updatedAt}` : "Sin ETA disponible")
  };
}

// Normalizar la respuesta de inventario del G7 para coincidir con lo que espera el chatbot
function normalizeInventory(inv: any) {
  if (!inv) return { productId: "", quantity: 0, available: false };
  const quantity = inv.availableStock ?? inv.quantity ?? 0;
  const available = quantity > 0;
  return {
    productId: inv.productId || "",
    quantity,
    available
  };
}

export function getAdapters({
  headers,
  correlationId,
}: {
  headers: any;
  correlationId: string;
}) {
  const requestHeaders = buildOutgoingHeaders({ headers, correlationId });

  return {
    auth: {
      validateToken: () =>
        getOrMock(
          config.services.auth,
          "/auth/validate",
          requestHeaders,
          mockData.auth
        ),
    },
    catalog: {
      findProduct: (query: string) => findProduct(query, requestHeaders),
    },
    orders: {
      getOrder: (orderId: string, userId: string) =>
        getOrder(orderId, userId, requestHeaders),
    },
    payments: {
      getPaymentByOrderId: (orderId: string) =>
        getPaymentByOrderId(orderId, requestHeaders),
    },
    inventory: {
      getInventory: (productId: string) =>
        getInventory(productId, requestHeaders),
    },
    shipping: {
      getShipmentByOrderId: (orderId: string) =>
        getShipmentByOrderId(orderId, requestHeaders),
    },
    notifications: {
      getNotifications: (userId: string) =>
        getNotifications(userId, requestHeaders),
    },
  };
}

function buildOutgoingHeaders({
  headers,
  correlationId,
}: {
  headers: any;
  correlationId: string;
}) {
  const outgoing: Record<string, string> = {
    "x-request-id": randomUUID(),
    "x-correlation-id": correlationId,
    "x-consumer": "chatbot-service",
  };

  if (headers.authorization) {
    outgoing.authorization = headers.authorization;
  }

  return outgoing;
}

async function findProduct(query: string, headers: Record<string, string>) {
  if (!config.mockMode && config.services.catalog) {
    try {
      // Caso 1: el usuario escribió un UUID directamente -> consulta
      // directa a GET /products/{id}, en vez de buscar por texto.
      if (isUuid(query)) {
        return await fetchJson(
          joinUrl(config.services.catalog, `/products/${encodeURIComponent(query)}`),
          headers,
          8000,
          "Catálogo (G3)"
        );
      }
 
      // Caso 2: búsqueda por texto -> el endpoint correcto es
      // /products/search (no /products, que es solo el listado paginado
      // sin filtro por texto).
      const params = new URLSearchParams({ q: query });
      const res = await fetchJson(
        joinUrl(config.services.catalog, `/products/search?${params}`),
        headers,
        8000,
        "Catálogo (G3)"
      );
      // G3 entrega los productos en una propiedad "data"
      const products = Array.isArray(res) ? res : res?.data ?? [];
      return products[0] || null;
    } catch (err: any) {
      if (err.message.includes("(404)")) {
        return null;
      }
      throw err;
    }
  }
 
  const normalized = query.toLowerCase();
  return (
    mockData.products.find((product) =>
      product.name.toLowerCase().includes(normalized)
    ) || mockData.products[0]
  );
}

async function getOrder(
  orderId: string,
  userId: string,
  headers: Record<string, string>
) {
  if (!config.mockMode && config.services.order) {
    try {
      // Caso 1: es un UUID -> consulta directa por ID real de G5
      if (isUuid(orderId)) {
        return await fetchJson(
          joinUrl(config.services.order, `/orders/${encodeURIComponent(orderId)}`),
          headers,
          8000,
          "Pedidos (G5)"
        );
      }

      // Caso 2: es un "orderNumber" tipo ORD-XXXX -> G5 no tiene endpoint
      // directo para esto, así que listamos los pedidos del usuario y
      // buscamos el que coincida por orderNumber.
      if (!userId) {
        return null;
      }
      const params = new URLSearchParams({ userId, size: "50" });
      const listResult = await fetchJson(
        joinUrl(config.services.order, `/orders?${params}`),
        headers,
        8000,
        "Pedidos (G5)"
      );
      const match = (listResult?.data ?? []).find(
        (order: any) =>
          order.order_number === orderId ||
          order.orderNumber === orderId ||
          order.id === orderId
      );
      return match ? normalizeOrder(match) : null;
    } catch (err: any) {
      if (err.message.includes("(404)") || err.message.includes("(400)")) {
        return null;
      }
      throw err;
    }
  }

  return (
    mockData.orders[orderId] ?? {
      id: orderId,
      userId,
      status: "EN_REVISION",
      items: [],
      totalAmount: 0,
    }
  );
}

async function getPaymentByOrderId(
  orderId: string,
  headers: Record<string, string>
) {
  if (!config.mockMode && config.services.payment) {
    const params = new URLSearchParams({ orderId });
    try {
      const res = await fetchJson(
        joinUrl(config.services.payment, `/payments?${params}`),
        headers,
        8000,
        "Pagos (G6)"
      );
      const paymentList = Array.isArray(res) ? res : res?.data ?? (typeof res === 'object' && res ? [res] : []);
      return paymentList[0] || null;
    } catch (err: any) {
      if (err.message.includes("(404)")) {
        return null;
      }
      throw err;
    }
  }

  return (
    mockData.paymentsByOrderId[orderId] ?? {
      id: "PAY-MOCK",
      orderId,
      status: "PENDING",
      amount: 0,
    }
  );
}

async function getInventory(productId: string, headers: Record<string, string>) {
  if (!config.mockMode && config.services.inventory) {
    try {
      const res = await fetchJson(
        joinUrl(config.services.inventory, `/inventory/${encodeURIComponent(productId)}`),
        headers,
        8000,
        "Inventario (G7)"
      );
      return normalizeInventory(res);
    } catch (err: any) {
      if (err.message.includes("(404)")) {
        return {
          productId,
          quantity: 0,
          available: false,
        };
      }
      throw err;
    }
  }

  return (
    mockData.inventory[productId] ?? {
      productId,
      quantity: 0,
      available: false,
    }
  );
}

async function getShipmentByOrderId(
  orderId: string,
  headers: Record<string, string>
) {
  if (!config.mockMode && config.services.shipping) {
    const params = new URLSearchParams({ orderId });
    try {
      const cleanUrl = config.services.shipping.replace(/\/health$/, "");
      const res = await fetchJson(
        joinUrl(cleanUrl, `/v1/shipments?${params}`),
        headers,
        8000,
        "Envíos (G8)"
      );
      const items = res?.items ?? [];
      return items[0] ? normalizeShipment(items[0]) : null;
    } catch (err: any) {
      if (err.message.includes("(404)")) {
        return null;
      }
      throw err;
    }
  }

  return (
    mockData.shipmentsByOrderId[orderId] ?? {
      orderId,
      trackingNumber: "SIN-TRACKING",
      status: "PENDIENTE",
      eta: "Sin ETA disponible",
    }
  );
}

async function getNotifications(
  userId: string,
  headers: Record<string, string>
) {
  if (!config.mockMode && config.services.notification) {
    const params = new URLSearchParams({ userId });
    try {
      const res = await fetchJson(
        joinUrl(config.services.notification, `/notifications?${params}`),
        headers,
        8000,
        "Notificaciones (G9)"
      );
      return Array.isArray(res) ? res : res?.data ?? [];
    } catch (err: any) {
      if (err.message.includes("(404)")) {
        return [];
      }
      throw err;
    }
  }

  return mockData.notificationsByUserId[userId] ?? [];
}

async function getOrMock(
  baseUrl: string,
  path: string,
  headers: Record<string, string>,
  fallback: any
) {
  if (!config.mockMode && baseUrl) {
    return fetchJson(joinUrl(baseUrl, path), headers, 8000, "Autenticación (G2)");
  }

  return fallback;
}

async function fetchJson(url: string, headers: Record<string, string>, timeoutMs = 8000, groupLabel?: string) {
  const correlationId = headers["x-correlation-id"] || "UNKNOWN";
  const requestId = headers["x-request-id"] || "UNKNOWN";
  
  console.log(`\n┌── 🌐 [LLAMADA SALIENTE] ──────────────────────────────────────────┐`);
  if (groupLabel) {
    console.log(`│  Grupo Destino: ${groupLabel}`);
  }
  console.log(`│  Ruta: GET ${url}`);
  console.log(`│  Correlation ID: ${correlationId}`);
  console.log(`│  Request ID: ${requestId}`);
  console.log(`└───────────────────────────────────────────────────────────────────┘`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { 
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    console.log(`\n┌── ✅ [RESPUESTA RECIBIDA] ────────────────────────────────────────┐`);
    if (groupLabel) {
      console.log(`│  Grupo Origen: ${groupLabel}`);
    }
    console.log(`│  Ruta: GET ${url}`);
    console.log(`│  Estado HTTP: ${response.status}`);
    console.log(`│  Correlation ID: ${correlationId}`);
    console.log(`└───────────────────────────────────────────────────────────────────┘`);

    if (!response.ok) {
      throw new Error(`Servicio externo no disponible (${response.status})`);
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      console.error(`\n┌── ⚠️ [ERROR DE TIEMPO DE ESPERA] ──────────────────────────────────┐`);
      if (groupLabel) {
        console.error(`│  Grupo: ${groupLabel}`);
      }
      console.error(`│  Falla: Timeout superado (${timeoutMs}ms) en GET ${url}`);
      console.error(`│  Correlation ID: ${correlationId}`);
      console.error(`└───────────────────────────────────────────────────────────────────┘`);
      throw new Error(`Servicio externo no disponible (TIMEOUT)`);
    }
    console.error(`\n┌── ❌ [ERROR DE CONEXIÓN] ─────────────────────────────────────────┐`);
    if (groupLabel) {
      console.error(`│  Grupo: ${groupLabel}`);
    }
    console.error(`│  Falla: GET ${url}`);
    console.error(`│  Detalle: ${error.message}`);
    console.error(`│  Correlation ID: ${correlationId}`);
    console.error(`└───────────────────────────────────────────────────────────────────┘`);
    throw error;
  }
}