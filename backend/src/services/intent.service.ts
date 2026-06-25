export function detectIntent(message: string): string {
  const text = normalize(message);

  if (
    includesAny(text, [
      "metodos de pago",
      "formas de pago",
      "devolucion",
      "garantia",
      "ayuda",
    ])
  ) {
    return "faq";
  }

  if (
    includesAny(text, [
      "pago",
      "pagado",
      "aprobado",
      "rechazado",
      "payment",
    ])
  ) {
    return "payment_status";
  }

  if (
    includesAny(text, [
      "despacho",
      "envio",
      "tracking",
      "llega",
      "entrega",
      "shipping",
    ])
  ) {
    return "shipping_status";
  }

  if (includesAny(text, ["pedido", "orden", "order"])) {
    return "order_status";
  }

  if (
    includesAny(text, ["stock", "disponible", "unidades", "inventario"])
  ) {
    return "stock_info";
  }

  if (
    includesAny(text, ["producto", "precio", "catalogo", "descripcion"])
  ) {
    return "product_info";
  }

  if (
    includesAny(text, ["notificacion", "mensaje nuevo", "alerta"])
  ) {
    return "notifications";
  }

  return "unknown";
}

export function extractEntities(message: string): {
  orderId: string;
  productQuery: string;
} {
  const orderMatch = message.match(/\b(?:ORD[-\s]?)?\d{3,}\b/i);
  const productMatch = message.match(
    /(?:producto|stock|disponible|precio|catalogo)\s+(?:de\s+|del\s+|para\s+)?(.+)/i
  );

  return {
    orderId: normalizeOrderId(orderMatch?.[0] ?? "ORD-1001"),
    productQuery: cleanProductQuery(productMatch?.[1] ?? message),
  };
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function includesAny(value: string, candidates: string[]): boolean {
  return candidates.some((candidate) => value.includes(candidate));
}

function normalizeOrderId(value: string): string {
  const digits = value.match(/\d{3,}/)?.[0] ?? "1001";
  return `ORD-${digits}`;
}

function cleanProductQuery(value: string): string {
  return (
    value
      .replace(/[?!.]+$/g, "")
      .replace(/\b(hay|del|de|el|la|los|las|un|una)\b/gi, "")
      .trim() || "producto"
  );
}
