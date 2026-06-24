const baseUrl = process.env.CHATBOT_BASE_URL ?? "http://localhost:3000";

const response = await fetch(`${baseUrl}/chat/message`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-api-key": process.env.CHATBOT_API_KEY || "mk-chatbot-abc123xyz",
    "x-request-id": crypto.randomUUID(),
    "x-correlation-id": crypto.randomUUID(),
    "x-consumer": "chatbot-service",
  },
  body: JSON.stringify({
    session_id: "550e8400-e29b-41d4-a716-446655440000",
    message: "Donde esta mi pedido ORD-1001?",
    context: {
      user_id: "USR-01",
    },
  }),
});

const data = await response.json();

console.log(JSON.stringify(data, null, 2));

if (!response.ok) {
  process.exitCode = 1;
}
