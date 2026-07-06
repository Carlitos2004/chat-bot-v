import crypto from "node:crypto";

const baseUrl = process.env.CHATBOT_BASE_URL ?? "http://localhost:3010";
const apiKey = process.env.CHATBOT_API_KEY || "mk-chatbot-abc123xyz";
const sessionId = "550e8400-e29b-41d4-a716-446655440000";

async function askChatbot(message, userId = "USR-01") {
  const correlationId = crypto.randomUUID();
  console.log(`\n💬 Mensaje enviado: "${message}"`);
  console.log(`   Correlation-ID: ${correlationId}`);
  
  try {
    const res = await fetch(`${baseUrl}/chat`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "x-request-id": crypto.randomUUID(),
        "x-correlation-id": correlationId,
        "x-consumer": "integration-test",
      },
      body: JSON.stringify({
        session_id: sessionId,
        message,
        context: {
          user_id: userId,
        },
      }),
    });
    
    const data = await res.json();
    console.log(`   Respuesta Status: ${res.status}`);
    if (res.ok) {
      console.log(`🤖 Respuesta bot: "${data.response}"`);
      console.log(`   Fuentes consultadas: ${(data.sources_consulted || []).join(", ") || "lógica interna"}`);
    } else {
      console.error(`❌ Error (${data.code}): ${data.message}`);
    }
  } catch (e) {
    console.error("❌ Fallo de red:", e.message);
  }
}

console.log("=== INICIANDO PRUEBAS DE INTEGRACIÓN REALES ===");

// Esperar 2 segundos para iniciar
await new Promise(r => setTimeout(r, 2000));

// 1. Probar consulta de Catálogo (G3)
await askChatbot("Busca el producto Caña Shimano Sedona");

// 2. Probar consulta de Stock (G3 + G7)
await askChatbot("¿Tiene stock disponible la Caña Shimano Sedona?");

// 3. Probar consulta de Pedidos (G5)
await askChatbot("¿Cuál es el estado de mi pedido ORD-1001?");

// 4. Probar consulta de Pagos (G5 + G6)
await askChatbot("¿Está pagado el pedido ORD-1001?");

// 5. Probar consulta de Envíos (G5 + G8)
await askChatbot("¿Dónde está el despacho de mi pedido ORD-1001?");

// 6. Probar consulta de Notificaciones (G9)
await askChatbot("¿Tengo notificaciones pendientes?");

console.log("\n=== PRUEBAS FINALIZADAS ===");
