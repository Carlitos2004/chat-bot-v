import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import { mockData } from "./mockData.js";

export function getAdapters({ headers, correlationId }) {
  const requestHeaders = buildOutgoingHeaders({ headers, correlationId });

  return {
    auth: {
      validateToken: () => getOrMock(config.services.auth, "/auth/validate", requestHeaders, mockData.auth),
    },
    catalog: {
      findProduct: (query) => findProduct(query, requestHeaders),
    },
    orders: {
      getOrder: (orderId, userId) => getOrder(orderId, userId, requestHeaders),
    },
    payments: {
      getPaymentByOrderId: (orderId) => getPaymentByOrderId(orderId, requestHeaders),
    },
    inventory: {
      getInventory: (productId) => getInventory(productId, requestHeaders),
    },
    shipping: {
      getShipmentByOrderId: (orderId) => getShipmentByOrderId(orderId, requestHeaders),
    },
    notifications: {
      getNotifications: (userId) => getNotifications(userId, requestHeaders),
    },
  };
}

function buildOutgoingHeaders({ headers, correlationId }) {
  const outgoing = {
    "x-request-id": randomUUID(),
    "x-correlation-id": correlationId,
    "x-consumer": "chatbot-service",
  };

  if (headers.authorization) {
    outgoing.authorization = headers.authorization;
  }

  return outgoing;
}

async function findProduct(query, headers) {
  if (!config.mockMode && config.services.catalog) {
    const params = new URLSearchParams({ q: query });
    const products = await fetchJson(`${config.services.catalog}/products?${params}`, headers);
    return Array.isArray(products) ? products[0] : products;
  }

  const normalized = query.toLowerCase();
  return (
    mockData.products.find((product) => product.name.toLowerCase().includes(normalized)) ||
    mockData.products[0]
  );
}

async function getOrder(orderId, userId, headers) {
  if (!config.mockMode && config.services.order) {
    return fetchJson(`${config.services.order}/orders/${encodeURIComponent(orderId)}`, headers);
  }

  return mockData.orders[orderId] ?? {
    id: orderId,
    userId,
    status: "EN_REVISION",
    items: [],
    totalAmount: 0,
  };
}

async function getPaymentByOrderId(orderId, headers) {
  if (!config.mockMode && config.services.payment) {
    const params = new URLSearchParams({ orderId });
    return fetchJson(`${config.services.payment}/payments?${params}`, headers);
  }

  return mockData.paymentsByOrderId[orderId] ?? {
    id: "PAY-MOCK",
    orderId,
    status: "PENDING",
    amount: 0,
  };
}

async function getInventory(productId, headers) {
  if (!config.mockMode && config.services.inventory) {
    return fetchJson(`${config.services.inventory}/inventory/${encodeURIComponent(productId)}`, headers);
  }

  return mockData.inventory[productId] ?? {
    productId,
    quantity: 0,
    available: false,
  };
}

async function getShipmentByOrderId(orderId, headers) {
  if (!config.mockMode && config.services.shipping) {
    const params = new URLSearchParams({ orderId });
    return fetchJson(`${config.services.shipping}/shipments?${params}`, headers);
  }

  return mockData.shipmentsByOrderId[orderId] ?? {
    orderId,
    trackingNumber: "SIN-TRACKING",
    status: "PENDIENTE",
    eta: "Sin ETA disponible",
  };
}

async function getNotifications(userId, headers) {
  if (!config.mockMode && config.services.notification) {
    const params = new URLSearchParams({ userId });
    return fetchJson(`${config.services.notification}/notifications?${params}`, headers);
  }

  return mockData.notificationsByUserId[userId] ?? [];
}

async function getOrMock(baseUrl, path, headers, fallback) {
  if (!config.mockMode && baseUrl) {
    return fetchJson(`${baseUrl}${path}`, headers);
  }

  return fallback;
}

async function fetchJson(url, headers) {
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`Servicio externo no disponible (${response.status})`);
  }

  return response.json();
}
