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
  if (includesAny(text, ["stock", "inventario", "disponible", "quedan", "cuantos", "cuanto", "hay", "tienen", "tiene", "queda", "unidades"])) return "stock_info";
  if (includesAny(text, ["producto", "precio", "catalogo"])) return "product_info";
  if (includesAny(text, ["notificacion", "mensaje", "alerta"])) return "notifications";

  // 7. FALLBACK: Si es una pregunta general pero no calza exacto
  if (includesAny(text, ["como", "que", "cual", "donde", "tiene costo"]) && !hasOrderRef) {
    return "faq_envios"; // Por defecto asumimos duda de envíos si pregunta "cuánto demora"
  }

  return "unknown";
}

export function extractEntities(message: string): {
  orderId: string;
  productQuery: string;
} {
  // Si el mensaje contiene un UUID en cualquier parte, úsalo directo como
  // productQuery (bypass de la extracción de texto libre). Esto evita que
  // palabras vecinas como "tienen", "hay", etc. queden pegadas al UUID y
  // rompan la detección de isUuid() más adelante en upstreamMocks.service.ts.
  const uuidInMessage = message.match(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i
  )?.[0];
 
  // Antes exigía que "de/del/para" viniera INMEDIATAMENTE después de la
  // palabra clave (producto|stock|...). Con frases como "stock tienen de X",
  // la palabra "tienen" rompía esa cercanía y "tienen" quedaba pegado al
  // inicio de productQuery, arruinando la búsqueda en el catálogo. Ahora
  // busca la preposición en cualquier punto después de la palabra clave.
  const productMatch = message.match(
    /(?:producto|stock|disponible|precio|catalogo)\b(?:.*?\b(?:de|del|para)\b)?\s*(.+)/i
  );
 
  return {
    orderId: extractOrderId(message),
    productQuery:
      uuidInMessage ?? cleanProductQuery(productMatch?.[1] ?? message),
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

  // 3. Fallback: vacío
  return "";
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
      // 1. EL MATAMOSCAS CORREGIDO: Ahora también elimina comillas dobles (") y simples (')
      .replace(/[?!"',¿¡#@$%&^*+='~<>{}\[\]|\\\/]+/g, "")
      
      // 2. Quita el punto SOLO si está al final absoluto
      .replace(/\.$/, "")
      
      // 3. Borra palabras de stock/unidades
      .replace(/\b(cuantos|cuantas|cuántos|cuántas|cuanto|cuanta|cuánto|cuánta|unidades|unidad|stock|inventario|disponible|cantidad|quedan|queda)\b/gi, "")
      
      // 4. Quita palabras de cortesía y coloquiales
      .replace(/\b(por favor|gracias|tienen|tiene|hay|esto|este|esta|quiero)\b/gi, "")
      
      // 5. Quita artículos y preposiciones
      .replace(/\b(del|de|para|el|la|los|las|un|una)\b/gi, "")
      
      // 6. Elimina letras sueltas al final
      .replace(/\b[a-z]\b$/gi, "")
      
      // 7. Limpia espacios dobles
      .replace(/\s+/g, " ")
      .trim() || "producto"
  );
}