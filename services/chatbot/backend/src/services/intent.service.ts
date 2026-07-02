export function detectIntent(message: string): string {
  const text = normalize(message);
  const hasOrderRef = text.includes("ord-");

  // 1. FAQ CUENTA
  if (includesAny(text, ["registro", "contraseña", "clave", "perfil", "datos", "cuenta"])) {
    return "faq_cuenta";
  }

  // 2. FAQ PRODUCTOS / DEVOLUCIONES
  if (includesAny(text, ["devolucion", "garantia", "original", "marca", "tipo"])) {
    return "faq_productos";
  }

  // 3. PAGOS (Transaccional vs FAQ)
  if (includesAny(text, ["pago", "pagado", "tarjeta", "transferencia", "reembolso", "cuota"])) {
    return hasOrderRef ? "payment_status" : "faq_pagos";
  }

  // 4. ENVIOS (Transaccional vs FAQ)
  if (includesAny(text, ["despacho", "envio", "tracking", "llega", "entrega", "shipping", "regiones"])) {
    return hasOrderRef ? "shipping_status" : "faq_envios";
  }

  // 5. PEDIDOS TRANSACCIONALES
  if (includesAny(text, ["pedido", "orden", "order"])) {
    return "order_status";
  }

  // 6. INVENTARIO Y CATALOGO
  if (includesAny(text, ["stock", "disponible", "unidades", "inventario"])) return "stock_info";
  if (includesAny(text, ["producto", "precio", "catalogo"])) return "product_info";
  if (includesAny(text, ["notificacion", "mensaje", "alerta"])) return "notifications";

  // 7. FALLBACK: Si es una pregunta general pero no calza exacto
  if (includesAny(text, ["cuanto", "como", "que", "cual", "donde", "tiene costo"]) && !hasOrderRef) {
    return "faq_envios"; // Por defecto asumimos duda de envíos si pregunta "cuánto demora"
  }

  return "unknown";
}

export function extractEntities(message: string): {
  orderId: string;
  productQuery: string;
} {
  const orderMatch = message.match(/\b(?:ORD[-\s]?)?\d+\b/i);
  const productMatch = message.match(
    /(?:producto|stock|disponible|precio|catalogo)\s+(?:de\s+|del\s+|para\s+)?(.+)/i
  );

  return {
    orderId: normalizeOrderId(orderMatch?.[0] ?? "ORD-1001"),
    productQuery: cleanProductQuery(productMatch?.[1] ?? message),
  };
}

// --- Funciones de utilidad originales ---

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Quita las tildes para que "cuánto" sea "cuanto"
}

function includesAny(value: string, candidates: string[]): boolean {
  return candidates.some((candidate) => value.includes(candidate));
}

function normalizeOrderId(value: string): string {
  const digits = value.match(/\d+/)?.[0] ?? "1001";
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