const messages = document.querySelector("#messages");
const form = document.querySelector("#chat-form");
const input = document.querySelector("#message-input");
const clearButton = document.querySelector("#clear-chat");
const apiStatus = document.querySelector("#api-status");
const sessionLabel = document.querySelector("#session-id");

const sessionId = crypto.randomUUID();
sessionLabel.textContent = sessionId;

checkHealth();

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = input.value.trim();
  if (!message) {
    return;
  }

  input.value = "";
  addMessage("user", message);
  const pending = addMessage("assistant", "Consultando...");

  try {
    const response = await fetch("/chat/message", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-request-id": crypto.randomUUID(),
        "x-correlation-id": crypto.randomUUID(),
        "x-consumer": "chatbot-service",
      },
      body: JSON.stringify({
        session_id: sessionId,
        message,
        context: {
          user_id: "USR-01",
        },
      }),
    });

    const data = await response.json();

    pending.remove();

    if (!response.ok) {
      addMessage("error", data.message || "No se pudo procesar la consulta.");
      return;
    }

    addMessage("assistant", data.response, `Intent: ${data.intent_detected} | Fuentes: ${data.sources_consulted.join(", ") || "sin servicios externos"}`);
  } catch {
    pending.remove();
    addMessage("error", "No se pudo conectar con la API local.");
  }
});

clearButton.addEventListener("click", () => {
  messages.innerHTML = "";
  input.focus();
});

async function checkHealth() {
  try {
    const response = await fetch("/health");
    apiStatus.textContent = response.ok ? "Activa" : "Error";
  } catch {
    apiStatus.textContent = "Sin conexion";
  }
}

function addMessage(role, text, meta = "") {
  const article = document.createElement("article");
  article.className = `message ${role}`;
  article.textContent = text;

  if (meta) {
    const metaElement = document.createElement("div");
    metaElement.className = "meta";
    metaElement.textContent = meta;
    article.appendChild(metaElement);
  }

  messages.appendChild(article);
  messages.scrollTop = messages.scrollHeight;
  return article;
}
