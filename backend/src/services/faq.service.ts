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

  // ==========================================
  // NIVEL ÚNICO: BASE DE DATOS (SUPABASE)
  // ==========================================
  try {
    const { data: dbItems, error: dbError } = await supabase
      .from("FAQs")
      .select("question, answer")
      .eq("category", category);

    if (dbError) {
      console.warn(`[Supabase] Error al consultar FAQs para '${category}':`, dbError.message);
      return {
        category,
        items: [],
        generated_at: timestamp,
        correlationId,
        error: dbError.message
      };
    }

    console.log(`\n┌── 🗄️ [CONSULTA SUPABASE - FAQs] ──────────────────────────────────┐`);
    console.log(`│  Categoría: ${category}`);
    console.log(`│  Registros Cargados: ${dbItems?.length ?? 0}`);
    console.log(`│  Correlation ID: ${correlationId}`);
    console.log(`└───────────────────────────────────────────────────────────────────┘`);
    return {
      category,
      items: dbItems || [],
      generated_at: timestamp,
      correlationId,
    };
  } catch (err: any) {
    console.warn(`[Supabase] Fallo crítico en la conexión al buscar FAQs:`, err.message);
    return {
      category,
      items: [],
      generated_at: timestamp,
      correlationId,
      error: err.message
    };
  }
}