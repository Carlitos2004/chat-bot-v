export function buildGeminiPrompt({ message, intent, context, fallback }) {
  return [
    "Eres el chatbot de soporte del ecosistema Mini Marketplace Cloud.",
    "Responde en espanol claro, breve y util.",
    "No inventes datos. Usa solo el JSON de contexto.",
    "Si falta informacion, dilo de forma amable.",
    "",
    `Mensaje del usuario: ${message}`,
    `Intent detectado: ${intent}`,
    `Contexto JSON: ${JSON.stringify(context)}`,
    `Respuesta fallback esperada si Gemini no mejora nada: ${fallback}`,
  ].join("\n");
}

export function buildFallbackResponse({ intent, context, entities }) {
  switch (intent) {
    case "order_status":
      return `Tu pedido ${context.order.id} esta ${context.order.status}. Total: $${context.order.totalAmount}.`;

    case "payment_status":
      return `El pago del pedido ${context.order.id} esta ${context.payment.status}. Monto: $${context.payment.amount}.`;

    case "shipping_status":
      return `Tu pedido ${context.order.id} esta en estado logistico ${context.shipment.status}. Tracking: ${context.shipment.trackingNumber}. ETA: ${context.shipment.eta}.`;

    case "product_info":
      return `${context.product.name}: ${context.product.description}. Precio: $${context.product.price}.`;

    case "stock_info":
      return context.inventory.available
        ? `Si, ${context.product.name} esta disponible. Quedan ${context.inventory.quantity} unidades.`
        : `Por ahora ${context.product.name} no tiene stock disponible.`;

    case "notifications":
      if (!context.notifications.length) {
        return "No tienes notificaciones pendientes.";
      }
      return `Tienes ${context.notifications.length} notificacion(es): ${context.notifications.map((item) => item.title).join("; ")}.`;

    case "faq":
      return "Aceptamos tarjetas de credito, debito y transferencia bancaria. Para pedidos personales debes iniciar sesion.";

    case "unknown":
    default:
      return `Puedo ayudarte con pedidos, pagos, despacho, productos, stock, notificaciones y preguntas frecuentes. Intenta mencionar un numero de pedido como ${entities.orderId}.`;
  }
}
