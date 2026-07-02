import { callGemini } from "./gemini.service.js";
import { config } from "../config/config.js";
import { supabase } from "../config/supabase.js"; // Asegúrate de que la ruta sea correcta según donde esté tu archivo supabase.ts

const FAQ_FALLBACKS: Record<
  string,
  Array<{ question: string; answer: string }>
> = {
  faq_envios: [
    {
      question: "¿Cuánto demora el despacho a regiones?",
      answer: "El despacho a regiones tarda entre 3 y 5 días hábiles dependiendo de la provincia y la zona geográfica.",
    },
    {
      question: "¿Cómo puedo hacer seguimiento a mi despacho?",
      answer: "Una vez enviado el pedido, recibirás un correo con el número de seguimiento (tracking) para monitorear el estado del despacho.",
    },
    {
      question: "¿Tiene costo de envío a domicilio?",
      answer: "El costo de envío se calcula automáticamente en el checkout basándose en la distancia y las dimensiones del paquete.",
    },
  ],
  faq_pagos: [
    {
      question: "¿Cuáles son los métodos de pago disponibles?",
      answer: "Aceptamos tarjetas de débito, crédito (Visa, Mastercard, etc.) y transferencias bancarias directas.",
    },
    {
      question: "¿Puedo pagar en cuotas?",
      answer: "Sí, puedes diferir tus compras en hasta 3 cuotas sin interés utilizando tarjetas de crédito de bancos seleccionados.",
    },
    {
      question: "¿Cómo solicito un reembolso?",
      answer: "Puedes solicitar un reembolso dentro de los 30 días hábiles posteriores a tu compra si el producto califica bajo nuestra política de satisfacción.",
    },
  ],
  faq_cuenta: [
    {
      question: "¿Cómo puedo registrarme en la plataforma?",
      answer: "Puedes crear una cuenta haciendo clic en el botón de Registro en la esquina superior derecha e ingresando tu correo electrónico.",
    },
    {
      question: "¿Cómo recupero mi contraseña?",
      answer: "En la sección de inicio de sesión, haz clic en '¿Olvidaste tu contraseña?' para recibir un enlace de restablecimiento seguro en tu correo.",
    },
    {
      question: "¿Dónde puedo modificar mis datos personales?",
      answer: "Puedes actualizar tu nombre, dirección y teléfono ingresando directamente a la sección 'Mi Perfil' una vez autenticado.",
    },
  ],
  faq_productos: [
    {
      question: "¿Tienen garantía los productos?",
      answer: "Todos los productos del marketplace tienen una garantía mínima legal de 6 meses por fallas de fábrica o defectos de material.",
    },
    {
      question: "¿Qué tipos de cañas de pesca venden?",
      answer: "Disponemos de un amplio catálogo que incluye cañas para spinning, casting, pesca con mosca y cañas telescópicas de diversas marcas premium.",
    },
    {
      question: "¿Cómo hago una devolución?",
      answer: "Ingresa a 'Mis Compras', selecciona la orden correspondiente y haz clic en 'Solicitar Devolución' para generar tu etiqueta de retorno.",
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

  // ==========================================
  // NIVEL 1: BASE DE DATOS (SUPABASE)
  // ==========================================
  try {
    const { data: dbItems, error: dbError } = await supabase
      .from("FAQs")
      .select("question, answer")
      .eq("category", category);

    if (dbError) {
      console.warn(`[Supabase] Error al consultar FAQs para '${category}':`, dbError.message);
    } else if (dbItems && dbItems.length > 0) {
      console.log(`[FAQs] Datos cargados EXITOSAMENTE desde Supabase para la categoría: ${category}`);
      return {
        category,
        items: dbItems,
        generated_at: timestamp,
        correlationId,
      };
    }
  } catch (err: any) {
    console.warn(`[Supabase] Fallo crítico en la conexión al buscar FAQs:`, err.message);
  }

  // ==========================================
  // NIVEL 2: INTELIGENCIA ARTIFICIAL (GEMINI)
  // ==========================================
  if (!config.gemini.enabled || !config.gemini.apiKey) {
    return {
      category,
      items: defaultItems,
      generated_at: timestamp,
      correlationId,
    };
  }

  const prompt = `Genera un array JSON con 3 preguntas frecuentes realistas y sus respuestas sobre el tema "${category}" en el contexto de un Mini Marketplace Cloud.
Las categorías permitidas según el contrato de la API son estrictamente:
- faq_envios: tiempos de despacho, zonas de cobertura, seguimiento de envíos, costos.
- faq_pagos: métodos de pago aceptados, reembolsos, facturación, cuotas.
- faq_cuenta: registro, recuperación de contraseña, datos personales, cierre.
- faq_productos: catálogo general, devoluciones, garantías, categorías.

Responde ÚNICAMENTE con el bloque de código JSON, sin explicaciones ni markdown extra. El formato debe ser un array de objetos con las propiedades "question" y "answer":
[
  { "question": "¿...", "answer": "..." },
  ...
]`;

  try {
    const rawResponse = await callGemini(prompt);
    const cleaned = rawResponse.replace(/```json|```/g, "").trim();
    const items = JSON.parse(cleaned);

    if (
      Array.isArray(items) &&
      items.length > 0 &&
      items[0].question &&
      items[0].answer
    ) {
      console.log(`[FAQs] Datos generados por Gemini para la categoría: ${category}`);
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

  // ==========================================
  // NIVEL 3: FALLBACK LOCAL (ÚLTIMO RECURSO)
  // ==========================================
  console.log(`[FAQs] Usando datos locales (fallback) para la categoría: ${category}`);
  return {
    category,
    items: defaultItems,
    generated_at: timestamp,
    correlationId,
  };
}