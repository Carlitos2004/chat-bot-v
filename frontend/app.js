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
let sessionId   = crypto.randomUUID();

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
// PREGUNTAS FRECUENTES DINÁMICAS (Categorías + Base de Datos)
// ==============================================

function bindFaqEvents(container) {
  const categories = container.querySelectorAll(".faq-category-card");
  const drawer = container.querySelector("#faq-drawer");
  const drawerTitle = container.querySelector("#faq-drawer-title");
  const drawerContent = container.querySelector("#faq-drawer-content");
  const closeBtn = container.querySelector("#close-faq-drawer");

  if (closeBtn && drawer) {
    closeBtn.addEventListener("click", () => {
      drawer.classList.remove("active");
      categories.forEach(c => c.classList.remove("active"));
    });
  }

  categories.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const category = btn.getAttribute("data-category");
      if (!category) return;

      // Si ya está activa, la cerramos
      if (btn.classList.contains("active")) {
        drawer.classList.remove("active");
        btn.classList.remove("active");
        return;
      }

      // Marcar activa la categoría seleccionada
      categories.forEach(c => c.classList.remove("active"));
      btn.classList.add("active");

      // Configurar título del drawer
      const categoryNames = {
        faq_cuenta: "Cuenta",
        faq_envios: "Envíos",
        faq_pagos: "Pagos",
        faq_productos: "Productos"
      };
      const catName = categoryNames[category] || "Preguntas frecuentes";
      if (drawerTitle) drawerTitle.textContent = `Preguntas sobre ${catName}`;

      // Mostrar el drawer agregando la clase active
      if (drawer) drawer.classList.add("active");

      // Cargar preguntas desde la base de datos
      if (drawerContent) {
        drawerContent.innerHTML = `
          <div class="faq-loading">
            <div class="typing-loader">
              <span></span><span></span><span></span>
            </div>
            <p>Consultando base de datos...</p>
          </div>
        `;

        try {
          const response = await fetch(`/chat/faq/${category}`, {
            method: "GET",
            headers: {
              "x-api-key": API_KEY,
              "x-request-id": crypto.randomUUID(),
              "x-correlation-id": crypto.randomUUID(),
            }
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Error del servidor (${response.status})`);
          }

          const data = await response.json();
          
          if (!data.items || data.items.length === 0) {
            drawerContent.innerHTML = `
              <div class="faq-empty-state">
                <span class="empty-icon">📂</span>
                <p>No se encontraron preguntas registradas en la base de datos para la categoría <strong>${catName.toLowerCase()}</strong>.</p>
              </div>
            `;
            return;
          }

          drawerContent.innerHTML = "";
          data.items.forEach((item) => {
            const faqBtn = document.createElement("button");
            faqBtn.className = "faq-question-item animate-fade-in";
            faqBtn.type = "button";
            faqBtn.innerHTML = `
              <span class="faq-question-text">${item.question}</span>
              <svg class="faq-item-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            `;
            
            // Al hacer clic, enviar la pregunta al chat
            faqBtn.addEventListener("click", async () => {
              if (drawer) drawer.classList.remove("active");
              await sendMessage(item.question);
            });
            
            drawerContent.appendChild(faqBtn);
          });

        } catch (err) {
          console.error("Error fetching FAQs:", err);
          drawerContent.innerHTML = `
            <div class="faq-error-state">
              <span class="error-icon">✕</span>
              <p>Error de conexión</p>
              <span class="error-detail">${err.message}</span>
            </div>
          `;
        }
      }
    });
  });
}

bindFaqEvents(messagesWrap);

// ==============================================
// BOTÓN NUEVO CHAT
// ==============================================

clearBtn.addEventListener("click", () => {
  messagesWrap.style.transition = "opacity 0.2s ease";
  messagesWrap.style.opacity = "0";
  setTimeout(() => {
    messageCount = 0;
    sessionId = crypto.randomUUID(); // Generar una nueva sesión de chat
    messagesWrap.innerHTML = buildWelcomeScreen();
    bindFaqEvents(messagesWrap);
    messagesWrap.style.opacity = "1";
    input.focus();
    if (window.innerWidth <= 768) {
      collapseSidebar();
    }
  }, 200);
});

function buildWelcomeScreen() {
  return `
    <div class="welcome-screen animate-fade-in" id="welcome-view">
      <div class="welcome-inner">
        <h1 class="welcome-heading">
          <span class="gradient-text">Hola,</span><br>
          <span class="welcome-sub">¿en qué puedo ayudarte?</span>
        </h1>
        <p class="welcome-desc">Soy un asistente comercial de ecosistema minimarket cloud, puedo ayudarte en el pedido, pago, stock, información de envíos.</p>

        <div class="faq-section">
          <h3 class="faq-section-title">Preguntas frecuentes por categoría</h3>
          <div class="faq-categories-grid">
            <button class="faq-category-card" data-category="faq_cuenta" type="button">
              <span class="category-icon">👤</span>
              <span class="category-name">Cuenta</span>
            </button>
            <button class="faq-category-card" data-category="faq_envios" type="button">
              <span class="category-icon">🚚</span>
              <span class="category-name">Envíos</span>
            </button>
            <button class="faq-category-card" data-category="faq_pagos" type="button">
              <span class="category-icon">💳</span>
              <span class="category-name">Pagos</span>
            </button>
            <button class="faq-category-card" data-category="faq_productos" type="button">
              <span class="category-icon">📦</span>
              <span class="category-name">Productos</span>
            </button>
          </div>

          <!-- Drawer/Apartadito para mostrar preguntas frecuentes dinámicamente -->
          <div class="faq-drawer-container" id="faq-drawer">
            <div class="faq-drawer-header">
              <h4 id="faq-drawer-title">Preguntas frecuentes</h4>
              <button class="faq-drawer-close" id="close-faq-drawer" type="button" aria-label="Cerrar panel">✕</button>
            </div>
            <div class="faq-drawer-content" id="faq-drawer-content">
              <p class="faq-placeholder">Selecciona una categoría de arriba para ver las preguntas frecuentes asociadas.</p>
            </div>
          </div>
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
    const response = await fetch("/chat", {
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

function formatMarkdown(text) {
  const raw = String(text ?? "");
  if (!raw) return "";
  let html = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  const lines = html.split("\n");
  let inList = false;
  const processed = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      if (!inList) { inList = true; processed.push("<ul>"); }
      processed.push(`<li>${trimmed.substring(2)}</li>`);
    } else {
      if (inList) { inList = false; processed.push("</ul>"); }
      processed.push(line);
    }
  }
  if (inList) processed.push("</ul>");
  return processed.join("\n");
}

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
    msgText.innerHTML = formatMarkdown(text);
  }

  content.appendChild(msgText);

  if (role === "assistant" && !isLoading) {
    const actions = document.createElement("div");
    actions.className = "msg-actions";
    actions.innerHTML = `
      <button class="action-icon-btn" title="Copiar respuesta" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
      <button class="action-icon-btn" title="Me gusta" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
        </svg>
      </button>
      <button class="action-icon-btn" title="No me gusta" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path>
        </svg>
      </button>
      <button class="action-icon-btn" title="Regenerar respuesta" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
        </svg>
      </button>
    `;
    
    const copyBtn = actions.querySelector('[title="Copiar respuesta"]');
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.style.color = "#34d399";
          setTimeout(() => { copyBtn.style.color = ""; }, 1500);
        });
      });
    }

    const likeBtn = actions.querySelector('[title="Me gusta"]');
    const dislikeBtn = actions.querySelector('[title="No me gusta"]');
    if (likeBtn) {
      likeBtn.addEventListener("click", () => {
        likeBtn.classList.toggle("active");
        if (dislikeBtn) dislikeBtn.classList.remove("active");
      });
    }
    if (dislikeBtn) {
      dislikeBtn.addEventListener("click", () => {
        dislikeBtn.classList.toggle("active");
        if (likeBtn) likeBtn.classList.remove("active");
      });
    }
    
    content.appendChild(actions);
  }

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

        if (status === "ok") {
          badgeClass = "ok";
          badgeText = "activo";
        } else if (status === "ok (mock)" || status === "mocked" || status === "not_configured") {
          badgeClass = "inactive";
          badgeText = "inactivo";
        }

        const spanishNames = {
          gemini: "Gemini",
          auth_service: "Autenticación",
          catalog_service: "Catálogo",
          order_service: "Pedidos",
          payment_service: "Pagos",
          inventory_service: "Inventario",
          shipment_service: "Envíos",
          notification_service: "Notificaciones"
        };
        const cleanName = spanishNames[name] || name;

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
if (window.innerWidth <= 768) {
  collapseSidebar();
}
