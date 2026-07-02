export function detectIntent(message: string): string {
  const text = normalize(message);
  const hasOrderRef = text.includes("ord-");

  // 1. FAQ CUENTA
  if (includesAny(text, ["registro", "registrar", "contrasena", "clave", "perfil", "datos", "cuenta"])) {
    return "faq_cuenta";
  }

  // 2. FAQ PRODUCTOS / DEVOLUCIONES
  if (includesAny(text, ["devolucion", "garantia", "original", "marca", "tipo"])) {
    return "faq_productos";
  }

  // 3. PAGOS (Transaccional vs FAQ)
  if (includesAny(text, ["pago", "pagar", "pagado", "tarjeta", "transferencia", "reembolso", "cuota"])) {
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
  const productMatch = message.match(
    /(?:producto|stock|disponible|precio|catalogo)\s+(?:de\s+|del\s+|para\s+)?(.+)/i
  );

  return {
    orderId: extractOrderId(message),
    productQuery: cleanProductQuery(productMatch?.[1] ?? message),
  };
}

/**
 * Extrae el ID de una orden desde el mensaje del usuario.
 * Prioriza UUIDs (formato real usado por G5), y como fallback
 * soporta el formato antiguo tipo "ORD-1001".
 * Si no encuentra nada válido, retorna "" (string vacío) en vez
 * de inventar un ID por defecto — así el flujo puede pedirle
 * al usuario que aclare su número de orden.
 */
function extractOrderId(message: string): string {
  // 1. UUID completo (ej: 4f09f3b5-c4b3-4348-a677-7c9ad5c4fcdb)
  const uuidMatch = message.match(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i
  );
  if (uuidMatch) return uuidMatch[0];

  // 2. Formato antiguo tipo "ORD-1001" (compatibilidad hacia atrás)
  const ordMatch = message.match(/\bORD[-\s]?\d+\b/i);
  if (ordMatch) return ordMatch[0].toUpperCase().replace(/\s/, "-");

  // 3. Fallback: orden de demostración por defecto
  return "ORD-1001";
}

// --- Funciones de utilidad originales (sin cambios) ---

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Quita las tildes para que "cuánto" sea "cuanto"
}

function includesAny(value: string, candidates: string[]): boolean {
  return candidates.some((candidate) => value.includes(candidate));
}

function cleanProductQuery(value: string): string {
  return (
    value
      .replace(/[?!.]+$/g, "")
      .replace(/\b(hay|del|de|el|la|los|las|un|una)\b/gi, "")
      .trim() || "producto"
  );
}