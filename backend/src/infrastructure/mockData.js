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
  },
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
  },
  paymentsByOrderId: {
    "ORD-1001": {
      id: "PAY-1001",
      orderId: "ORD-1001",
      status: "APPROVED",
      amount: 15990,
    },
  },
  shipmentsByOrderId: {
    "ORD-1001": {
      orderId: "ORD-1001",
      trackingNumber: "TRK-CL-1001",
      status: "EN_TRANSITO",
      eta: "2026-06-24",
    },
  },
  notificationsByUserId: {
    "USR-01": [
      {
        id: "NOT-01",
        title: "Tu pedido ORD-1001 esta en camino",
        read: false,
      },
    ],
  },
};
