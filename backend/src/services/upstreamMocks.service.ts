import { randomUUID } from "node:crypto";
import { config } from "../config/config.js";

export const mockData = {
  auth: {
    user_id: "USR-01",
    role: "customer",
    status: "ACTIVE",
  },
  products: [
    {
      id: "PROD-01",
      name: "Pescas",
      price: 15990,
      description: "Producto destacado del marketplace para pruebas de catalogo.",
    },
    {
      id: "PROD-02",
      name: "Audifonos Bluetooth",
      price: 24990,
      description: "Audifonos inalambricos con estuche de carga.",
    },
  ],
  inventory: {
    "PROD-01": {
      productId: "PROD-01",
      quantity: 15,
      available: true,
    },
    "PROD-02": {
      productId: "PROD-02",
      quantity: 4,
      available: true,
    },
  } as Record<string, { productId: string; quantity: number; available: boolean }>,
  orders: {
    "ORD-1001": {
      id: "ORD-1001",
      userId: "USR-01",
      status: "EN_TRANSITO",
      items: [
        {
          productId: "PROD-01",
          quantity: 1,
        },
      ],
      totalAmount: 15990,
    },
  } as Record<string, any>,
  paymentsByOrderId: {
    "ORD-1001": {
      id: "PAY-1001",
      orderId: "ORD-1001",
      status: "APPROVED",
      amount: 15990,
    },
  } as Record<string, any>,
  shipmentsByOrderId: {
    "ORD-1001": {
      orderId: "ORD-1001",
      trackingNumber: "TRK-CL-1001",
      status: "EN_TRANSITO",
      eta: "2026-06-24",
    },
  } as Record<string, any>,
  notificationsByUserId: {
    "USR-01": [
      {
        id: "NOT-01",
        title: "Tu pedido ORD-1001 esta en camino",
        read: false,
      },
    ],
  } as Record<string, any[]>,
};

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
    const params = new URLSearchParams({ q: query });
    const products = await fetchJson(
      `${config.services.catalog}/products?${params}`,
      headers
    );
    return Array.isArray(products) ? products[0] : products;
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
    return fetchJson(
      `${config.services.order}/orders/${encodeURIComponent(orderId)}`,
      headers
    );
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
    return fetchJson(
      `${config.services.payment}/payments?${params}`,
      headers
    );
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
    return fetchJson(
      `${config.services.inventory}/inventory/${encodeURIComponent(productId)}`,
      headers
    );
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
    return fetchJson(
      `${config.services.shipping}/shipments?${params}`,
      headers
    );
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
    return fetchJson(
      `${config.services.notification}/notifications?${params}`,
      headers
    );
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
    return fetchJson(`${baseUrl}${path}`, headers);
  }

  return fallback;
}

async function fetchJson(url: string, headers: Record<string, string>) {
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`Servicio externo no disponible (${response.status})`);
  }

  return response.json();
}
