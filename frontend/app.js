/* =============================================
   ASISTENTE DE SOPORTE — Mini Marketplace Cloud
   Frontend JS — ChatGPT-style interface
   ============================================= */

// --- Elementos del DOM ---
const messagesWrap       = document.getElementById("messages");
const form               = document.getElementById("chat-form");
const input              = document.getElementById("message-input");
const sendBtn            = document.getElementById("send-btn");
const clearBtn           = document.getElementById("clear-chat");
const apiStatusEl        = document.getElementById("api-status");
const statusDotEl        = document.getElementById("status-dot");
const dependenciesListEl = document.getElementById("dependencies-list");
const onlineIndicatorEl  = document.getElementById("online-indicator");
const appShell           = document.getElementById("app-shell");
const toggleSidebar      = document.getElementById("toggle-sidebar");
const openSidebar        = document.getElementById("open-sidebar");
const mobileToggle       = document.getElementById("mobile-toggle");

// --- Constantes ---
const API_KEY   = "mk-chatbot-abc123xyz";
const sessionId = crypto.randomUUID();

// --- Estado ---
let messageCount = 0;

// ==============================================
// SIDEBAR — TOGGLE
// ==============================================

function collapseSidebar() {
  appShell.classList.add("sidebar-collapsed");
  openSidebar.style.display = "flex";
}

function expandSidebar() {
  appShell.classList.remove("sidebar-collapsed");
  openSidebar.style.display = "none";
}

toggleSidebar.addEventListener("click", collapseSidebar);
openSidebar.addEventListener("click", expandSidebar);
mobileToggle.addEventListener("click", () => {
  if (appShell.classList.contains("sidebar-collapsed")) {
    expandSidebar();
  } else {
    collapseSidebar();
  }
});

// Cerrar sidebar al hacer clic fuera en mobile
document.addEventListener("click", (e) => {
  if (window.innerWidth <= 768) {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
      if (!appShell.classList.contains("sidebar-collapsed")) {
        collapseSidebar();
      }
    }
  }
});

// ==============================================
// TEXTAREA AUTO-RESIZE
// ==============================================

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 160) + "px";
  sendBtn.disabled = input.value.trim().length === 0;
});

input.addEventListener("keydown", (e) => {
  // Enter sin shift envía el mensaje
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (!sendBtn.disabled) {
      form.dispatchEvent(new Event("submit", { cancelable: true }));
    }
  }
});

// ==============================================
// ENVÍO DEL FORMULARIO
// ==============================================

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  input.style.height = "auto";
  sendBtn.disabled = true;

  await sendMessage(text);
});

// ==============================================
// SUGERENCIAS (Tarjetas de la pantalla de bienvenida)
// ==============================================

function bindSuggestionCards(container) {
  container.querySelectorAll(".suggestion-card").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = btn.getAttribute("data-question");
      if (text) await sendMessage(text);
    });
  });
}

bindSuggestionCards(messagesWrap);

// ==============================================
// BOTÓN NUEVO CHAT
// ==============================================

clearBtn.addEventListener("click", () => {
  messageCount = 0;
  messagesWrap.innerHTML = buildWelcomeScreen();
  bindSuggestionCards(messagesWrap);
  input.focus();
});

function buildWelcomeScreen() {
  return `
    <div class="welcome-screen animate-fade-in" id="welcome-view">
      <div class="welcome-inner">
        <h1 class="welcome-heading">
          <span class="gradient-text">Hola,</span><br>
          <span class="welcome-sub">¿en qué puedo ayudarte?</span>
        </h1>
        <p class="welcome-desc">Soy el asistente conversacional del ecosistema Mini Marketplace Cloud. Puedo ayudarte con pedidos, pagos, stock e información de envíos.</p>
        <div class="suggestions-grid">
          <button class="suggestion-card" data-question="¿Dónde está mi pedido ORD-1001?" type="button">
            <span class="card-icon">📦</span>
            <div class="card-body"><strong>Rastrear pedido</strong><span>Consulta el estado de tu orden</span></div>
          </button>
          <button class="suggestion-card" data-question="¿Se aprobó el pago de mi pedido ORD-1001?" type="button">
            <span class="card-icon">💳</span>
            <div class="card-body"><strong>Estado de pago</strong><span>Verifica si el pago fue aprobado</span></div>
          </button>
          <button class="suggestion-card" data-question="¿Hay stock del producto Pescas?" type="button">
            <span class="card-icon">📋</span>
            <div class="card-body"><strong>Consultar stock</strong><span>Disponibilidad de productos</span></div>
          </button>
          <button class="suggestion-card" data-question="¿Cuánto demora el despacho a regiones?" type="button">
            <span class="card-icon">🚚</span>
            <div class="card-body"><strong>Tiempos de despacho</strong><span>Plazos y costos de envío</span></div>
          </button>
        </div>
      </div>
    </div>
  `;
}

// ==============================================
// ENVIAR MENSAJE AL BACKEND
// ==============================================

async function sendMessage(text) {
  // Ocultar pantalla de bienvenida
  const welcome = document.getElementById("welcome-view");
  if (welcome) welcome.remove();

  // Renderizar mensaje del usuario
  appendMessage("user", text);

  // Renderizar estado de carga
  const loadingEl = appendMessage("assistant", null, null, true);

  try {
    const response = await fetch("/chat/message", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": API_KEY,
        "x-request-id": crypto.randomUUID(),
        "x-correlation-id": crypto.randomUUID(),
        "x-consumer": "frontend",
      },
      body: JSON.stringify({
        session_id: sessionId,
        message: text,
        context: { user_id: "USR-01" },
      }),
    });

    const data = await response.json();
    loadingEl.remove();

    if (!response.ok) {
      appendMessage("error", data.message || "Error al procesar la solicitud.");
      return;
    }

    const meta = `Intent: ${data.intent_detected} · Fuentes: ${(data.sources_consulted || []).join(", ") || "lógica interna"}`;
    appendMessage("assistant", data.response, meta);

  } catch (err) {
    loadingEl.remove();
    appendMessage("error", "No se pudo conectar con el servidor. Asegúrate de que el backend esté en ejecución.");
    console.error("Fetch error:", err);
  }
}

// ==============================================
// RENDERIZAR MENSAJES
// ==============================================

function appendMessage(role, text, meta = null, isLoading = false) {
  messageCount++;

  const group = document.createElement("div");
  group.className = `message-group ${role} animate-slide-up`;

  const inner = document.createElement("div");
  inner.className = "message-inner";

  // Avatar
  const avatar = document.createElement("div");
  avatar.className = "msg-avatar";

  if (role === "user") {
    avatar.textContent = "U";
  } else if (role === "assistant") {
    avatar.textContent = "◆";
  } else {
    avatar.textContent = "!";
  }

  // Contenido
  const content = document.createElement("div");
  content.className = "msg-content";

  const msgText = document.createElement("div");
  msgText.className = "msg-text";

  if (isLoading) {
    msgText.innerHTML = `
      <div class="typing-loader">
        <span></span><span></span><span></span>
      </div>
    `;
  } else {
    msgText.textContent = text;
  }

  content.appendChild(msgText);

  if (meta) {
    const metaEl = document.createElement("div");
    metaEl.className = "msg-meta";
    metaEl.textContent = meta;
    content.appendChild(metaEl);
  }

  inner.appendChild(avatar);
  inner.appendChild(content);
  group.appendChild(inner);

  messagesWrap.appendChild(group);
  messagesWrap.scrollTop = messagesWrap.scrollHeight;

  return group;
}

// ==============================================
// HEALTH CHECK — Estado del Sistema
// ==============================================

async function checkHealth() {
  try {
    const res = await fetch("/health");
    if (!res.ok) throw new Error("unhealthy");
    const data = await res.json();

    // Actualizar indicador en header
    onlineIndicatorEl.classList.add("visible");

    // Actualizar status dot + texto
    const st = data.status || "ok";
    statusDotEl.className = "status-dot " + (st === "ok" ? "ok" : st === "degraded" ? "degraded" : "error");
    apiStatusEl.textContent = `Activo v${data.version}`;

    // Renderizar lista de microservicios
    if (data.dependencies && dependenciesListEl) {
      dependenciesListEl.innerHTML = "";
      Object.entries(data.dependencies).forEach(([name, status]) => {
        const li = document.createElement("li");
        li.className = "dep-item";

        let badgeClass = "error";
        let badgeText = "error";

        if (status === "ok") { badgeClass = "ok"; badgeText = "activo"; }
        else if (status === "mocked") { badgeClass = "mock"; badgeText = "simulado"; }

        const cleanName = name.replace(/_/g, " ").replace("service", "").trim();

        li.innerHTML = `
          <span class="dep-name">${cleanName}</span>
          <span class="dep-badge ${badgeClass}">${badgeText}</span>
        `;
        dependenciesListEl.appendChild(li);
      });
    }

  } catch (err) {
    statusDotEl.className = "status-dot error";
    apiStatusEl.textContent = "Sin conexión";
    onlineIndicatorEl.classList.remove("visible");
    if (dependenciesListEl) {
      dependenciesListEl.innerHTML = `
        <li class="dep-item">
          <span class="dep-name">Backend local</span>
          <span class="dep-badge error">apagado</span>
        </li>
      `;
    }
    console.warn("Health check failed:", err);
  }
}

// --- Inicializar ---
checkHealth();
