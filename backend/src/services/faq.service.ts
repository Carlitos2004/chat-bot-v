import { callGemini } from "./gemini.service.js";
import { config } from "../config/config.js";

const FAQ_FALLBACKS: Record<
  string,
  Array<{ question: string; answer: string }>
> = {
  faq_envios: [
    {
      question: "¿Cuánto demora el despacho a regiones?",
      answer:
        "El despacho a regiones tarda entre 3 y 5 días hábiles dependiendo de la provincia y la zona geográfica.",
    },
    {
      question: "¿Cómo puedo hacer seguimiento a mi despacho?",
      answer:
        "Una vez enviado el pedido, recibirás un correo con el número de seguimiento (tracking) para monitorear el estado del despacho.",
    },
    {
      question: "¿Tiene costo de envío a domicilio?",
      answer:
        "El costo de envío se calcula automáticamente en el checkout basándose en la distancia y las dimensiones del paquete.",
    },
  ],
  faq_pagos: [
    {
      question: "¿Cuáles son los métodos de pago disponibles?",
      answer:
        "Aceptamos tarjetas de débito, crédito (Visa, Mastercard, etc.) y transferencias bancarias directas.",
    },
    {
      question: "¿Puedo pagar en cuotas?",
      answer:
        "Sí, puedes diferir tus compras en hasta 3 cuotas sin interés utilizando tarjetas de crédito de bancos seleccionados.",
    },
    {
      question: "¿Cómo solicito un reembolso?",
      answer:
        "Puedes solicitar un reembolso dentro de los 30 días hábiles posteriores a tu compra si el producto califica bajo nuestra política de satisfacción.",
    },
  ],
  faq_productos: [
    {
      question: "¿Tienen garantía los productos?",
      answer:
        "Todos los productos del marketplace tienen una garantía mínima legal de 6 meses por fallas de fábrica o defectos de material.",
    },
    {
      question: "¿Qué tipos de cañas de pesca venden?",
      answer:
        "Disponemos de un amplio catálogo que incluye cañas para spinning, casting, pesca con mosca y cañas telescópicas de diversas marcas premium.",
    },
    {
      question: "¿Los productos son originales?",
      answer:
        "Sí, todos nuestros productos son 100% originales y provienen directamente de distribuidores autorizados.",
    },
  ],
  faq_devoluciones: [
    {
      question: "¿Cómo hago una devolución?",
      answer:
        "Ingresa a 'Mis Compras', selecciona la orden correspondiente y haz clic en 'Solicitar Devolución' para generar la etiqueta de envío de retorno.",
    },
    {
      question: "¿Cuáles son los requisitos para devolver un producto?",
      answer:
        "El producto debe estar sin uso, con sus etiquetas originales y en el mismo estado en que fue entregado.",
    },
    {
      question: "¿Cuánto tiempo tengo para realizar una devolución?",
      answer:
        "Tienes hasta 10 días hábiles desde la recepción del producto para retractarte y solicitar la devolución.",
    },
  ],
};

export async function getFaq({
  category,
  correlationId,
}: {
  category: string;
  correlationId: string;
}) {
  const timestamp = new Date().toISOString();
  const defaultItems = FAQ_FALLBACKS[category] || [];

  if (!config.gemini.enabled || !config.gemini.apiKey) {
    return {
      category,
      items: defaultItems,
      generated_at: timestamp,
      correlationId,
    };
  }

  const prompt = `Genera un array JSON con 3 preguntas frecuentes realistas y sus respuestas sobre el tema "${category}" en el contexto de un Mini Marketplace Cloud.
Las categorías permitidas son:
- faq_envios: tiempos de despacho, zonas de cobertura, seguimiento, costos.
- faq_pagos: métodos de pago, reembolsos, facturación, cuotas.
- faq_productos: catálogo, autenticidad, stock, marcas.
- faq_devoluciones: políticas de devolución, plazos, requisitos, reembolsos de devolución.

Responde ÚNICAMENTE con el bloque de código JSON, sin explicaciones ni markdown extra. El formato debe ser estrictamente un array de objetos con las propiedades "question" y "answer":
[
  { "question": "¿...", "answer": "..." },
  ...
]`;

  try {
    const rawResponse = await callGemini(prompt);
    // Remover markdown si Gemini responde con ```json ... ```
    const cleaned = rawResponse.replace(/```json|```/g, "").trim();
    const items = JSON.parse(cleaned);

    if (
      Array.isArray(items) &&
      items.length > 0 &&
      items[0].question &&
      items[0].answer
    ) {
      return {
        category,
        items,
        generated_at: timestamp,
        correlationId,
      };
    }
  } catch (error: any) {
    console.warn(
      `Error al obtener FAQ con Gemini para '${category}', usando fallback:`,
      error.message
    );
  }

  return {
    category,
    items: defaultItems,
    generated_at: timestamp,
    correlationId,
  };
}
