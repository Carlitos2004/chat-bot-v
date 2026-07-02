const baseUrl = process.env.CHATBOT_BASE_URL ?? "http://localhost:3000";
const apiKey = process.env.CHATBOT_API_KEY || "mk-chatbot-abc123xyz";
const sessionId = "550e8400-e29b-41d4-a716-446655440000";

let hasErrors = false;

// 1. Probar GET /health
try {
  console.log("Probando GET /health...");
  const res = await fetch(`${baseUrl}/health`);
  const data = await res.json();
  console.log(`Status: ${res.status}`);
  console.log(JSON.stringify(data, null, 2));
  if (!res.ok) hasErrors = true;
} catch (e) {
  console.error("Error al probar /health:", e);
  hasErrors = true;
}

// 2. Probar POST /chat
try {
  console.log("\nProbando POST /chat...");
  const res = await fetch(`${baseUrl}/chat`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "x-request-id": crypto.randomUUID(),
      "x-correlation-id": crypto.randomUUID(),
      "x-consumer": "smoke-test",
    },
    body: JSON.stringify({
      session_id: sessionId,
      message: "Donde esta mi pedido ORD-1001?",
      context: {
        user_id: "USR-01",
      },
    }),
  });
  const data = await res.json();
  console.log(`Status: ${res.status}`);
  console.log(JSON.stringify(data, null, 2));
  if (!res.ok) hasErrors = true;
} catch (e) {
  console.error("Error al probar /chat:", e);
  hasErrors = true;
}

// 3. Probar GET /chat/sessions/:sessionId
try {
  console.log(`\nProbando GET /chat/sessions/${sessionId}...`);
  const res = await fetch(`${baseUrl}/chat/sessions/${sessionId}`, {
    headers: {
      "x-api-key": apiKey,
    },
  });
  const data = await res.json();
  console.log(`Status: ${res.status}`);
  console.log(JSON.stringify(data, null, 2));
  if (!res.ok) hasErrors = true;
} catch (e) {
  console.error("Error al probar /chat/sessions:", e);
  hasErrors = true;
}

// 4. Probar GET /chat/faq/:category
try {
  console.log("\nProbando GET /chat/faq/faq_pagos...");
  const res = await fetch(`${baseUrl}/chat/faq/faq_pagos`, {
    headers: {
      "x-api-key": apiKey,
    },
  });
  const data = await res.json();
  console.log(`Status: ${res.status}`);
  console.log(JSON.stringify(data, null, 2));
  if (!res.ok) hasErrors = true;
} catch (e) {
  console.error("Error al probar /chat/faq:", e);
  hasErrors = true;
}

if (hasErrors) {
  console.error("\nPruebas completadas con fallas.");
  process.exitCode = 1;
} else {
  console.log("\nTodas las pruebas de humo pasaron correctamente.");
}
