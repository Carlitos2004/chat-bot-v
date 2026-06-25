# Manual Técnico — Chatbot Service (Grupo 11)

> Mini Marketplace Cloud — Proyecto Integrado Cloud  
> Evaluación E2: Mock, modelo de datos y primera implementación

---

## 1. Descripción del servicio

El **chatbot-service** es el servicio de soporte conversacional del ecosistema Mini Marketplace Cloud. Actúa como capa de atención e integración: recibe mensajes del usuario en lenguaje natural, los clasifica, consulta en tiempo real los servicios de otros grupos del ecosistema y devuelve una respuesta en español generada por **Gemini 2.0 Flash Lite** (o por respuestas de fallback si Gemini no está disponible).

| Campo | Valor |
|---|---|
| **Grupo** | 11 |
| **Servicio** | Chatbot de soporte |
| **Stack** | Node.js puro (sin frameworks), ESM |
| **IA** | Google Gemini API (gemini-2.0-flash-lite) |
| **Persistencia E2** | En memoria (sessionStore.js) |
| **Persistencia objetivo E3** | Supabase PostgreSQL |
| **Despliegue objetivo** | Render.com |
| **API Key predeterminada (mock)** | `mk-chatbot-abc123xyz` |

---

## 2. Arquitectura del servicio

El servicio usa una arquitectura por capas:

```
┌─────────────────────────────────────────────┐
│              Cliente (HTTP)                 │
│    Postman / Frontend / Otros grupos        │
└──────────────────┬──────────────────────────┘
                   │ HTTP
┌──────────────────▼──────────────────────────┐
│          backend/src/server.js              │
│     (http.createServer → handleRequest)     │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│           backend/src/app.js                │
│   Dispatcher: valida API Key, parsea body,  │
│   despacha al router correspondiente        │
└──┬───────────────┬───────────────┬──────────┘
   │               │               │
┌──▼──────┐  ┌─────▼──────┐  ┌────▼────────┐
│ routers/│  │ routers/   │  │ routers/    │
│ health  │  │ chat       │  │ session     │
│ Router  │  │ Router     │  │ Router +    │
│         │  │            │  │ faqRouter   │
└─────────┘  └─────┬──────┘  └─────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│          application/ (lógica de negocio)   │
│  processMessage.js  intentDetector.js       │
│  responseBuilder.js faqService.js           │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         infrastructure/ (adaptadores)       │
│  apiAdapters.js   geminiClient.js           │
│  sessionStore.js  mockData.js               │
└──────────────────┬──────────────────────────┘
                   │
     ┌─────────────┴──────────────┐
     │                            │
┌────▼───────┐           ┌────────▼──────────┐
│  Gemini    │           │  APIs externas     │
│  API       │           │  G2, G3, G5, G6,  │
│            │           │  G7, G8, G9        │
└────────────┘           └───────────────────┘
```

---

## 3. Estructura de archivos

```
chat bot/
├── backend/
│   └── src/
│       ├── models/                    ← Modelos de datos
│       │   ├── Message.js             ← Typedef + factory createMessage()
│       │   └── Session.js             ← Typedef + factory createSession()
│       ├── routers/                   ← Routers por endpoint
│       │   ├── index.js               ← Barrel: allRoutes[]
│       │   ├── healthRouter.js        ← GET /health
│       │   ├── chatRouter.js          ← POST /chat/message
│       │   ├── sessionRouter.js       ← GET /chat/session/{id}
│       │   └── faqRouter.js           ← GET /chat/faq/{category}
│       ├── application/               ← Lógica de negocio
│       │   ├── processMessage.js      ← Orquestador principal
│       │   ├── intentDetector.js      ← Clasificador de intents
│       │   ├── responseBuilder.js     ← Construcción de respuestas
│       │   └── faqService.js          ← FAQs (Gemini o fallback)
│       ├── infrastructure/            ← Acceso a datos y servicios externos
│       │   ├── apiAdapters.js         ← Llamadas a G2, G3, G5, G6, G7, G8, G9
│       │   ├── geminiClient.js        ← Cliente REST de Gemini API
│       │   ├── sessionStore.js        ← BD en memoria (usa models/)
│       │   └── mockData.js            ← Datos simulados para MOCK_MODE=true
│       ├── app.js                     ← Dispatcher HTTP principal
│       ├── config.js                  ← Variables de entorno
│       └── server.js                  ← Entrada: http.createServer
├── frontend/                          ← Interfaz web visual
├── postman/
│   └── chatbot-service.postman_collection.json  ← Colección importable
├── docs/
│   ├── MANUAL_TECNICO.md              ← Este archivo
│   ├── GEMINI.md
│   ├── INTEGRACIONES.md
│   └── LOGICA.md
└── scripts/
    ├── smoke-test.mjs                 ← Test rápido (npm run smoke)
    └── set-gemini-key.ps1
```

---

## 4. Modelo de datos

### 4.1 Message

Representa un mensaje individual dentro de una conversación.  
**Archivo:** `backend/src/models/Message.js`  
**Equivalente TypeScript (E2 Mock):** `chatbot-service-main/src/infrastructure/mock_database.ts`

| Campo | Tipo | Descripción |
|---|---|---|
| `role` | `'user' \| 'assistant'` | Quién emitió el mensaje |
| `content` | `string` | Texto del mensaje |
| `intent_detected` | `string \| null` | Intent clasificado. Solo en mensajes del asistente |
| `timestamp` | `string` (ISO 8601 UTC) | Fecha y hora de creación |

**Ejemplo:**
```json
{
  "role": "assistant",
  "content": "Tu pedido ORD-1001 está EN_TRÁNSITO. Total: $15990.",
  "intent_detected": "order_status",
  "timestamp": "2026-06-24T21:00:01.000Z"
}
```

**Factory:**
```js
import { createMessage } from "../models/Message.js";
const msg = createMessage("assistant", "Tu pedido está en camino.", "order_status");
```

---

### 4.2 Session

Representa una sesión de conversación completa.  
**Archivo:** `backend/src/models/Session.js`  
**Equivalente TypeScript (E2 Mock):** `chatbot-service-main/src/infrastructure/mock_database.ts`

| Campo | Tipo | Descripción |
|---|---|---|
| `session_id` | `string` (UUID) | Identificador único de la sesión |
| `user_id` | `string \| null` | ID del usuario autenticado. `null` si es anónimo |
| `status` | `'active' \| 'closed'` | Estado actual de la sesión |
| `messages` | `Message[]` | Historial cronológico de mensajes |

**Ejemplo:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "USR-01",
  "status": "active",
  "messages": [
    {
      "role": "user",
      "content": "¿Dónde está mi pedido ORD-1001?",
      "intent_detected": null,
      "timestamp": "2026-06-24T21:00:00.000Z"
    },
    {
      "role": "assistant",
      "content": "Tu pedido ORD-1001 está EN_TRÁNSITO. Total: $15990.",
      "intent_detected": "order_status",
      "timestamp": "2026-06-24T21:00:01.000Z"
    }
  ]
}
```

**Factory:**
```js
import { createSession } from "../models/Session.js";
const session = createSession("550e8400-e29b-41d4-a716-446655440000", "USR-01");
```

---

## 5. Endpoints

### 5.1 GET /health

Verifica el estado del servicio y sus dependencias. **No requiere X-Api-Key.**

| Campo | Valor |
|---|---|
| Método | `GET` |
| URL | `/health` |
| Auth | No requerida |
| Router | `routers/healthRouter.js` |

**Response 200:**
```json
{
  "status": "ok",
  "version": "1.1",
  "mock_mode": true,
  "dependencies": {
    "gemini": "error",
    "auth_service": "ok (mock)",
    "order_service": "ok (mock)"
  },
  "timestamp": "2026-06-24T21:00:00.000Z"
}
```

---

### 5.2 POST /chat/message

Endpoint principal conversacional. Recibe un mensaje, detecta el intent, consulta servicios externos y devuelve una respuesta.

| Campo | Valor |
|---|---|
| Método | `POST` |
| URL | `/chat/message` |
| Auth | `X-Api-Key` obligatorio |
| Router | `routers/chatRouter.js` |

**Headers requeridos:**

| Header | Requerido | Descripción |
|---|---|---|
| `X-Api-Key` | ✅ | Clave de autenticación del chatbot |
| `X-Request-Id` | ✅ | UUID único de la petición |
| `X-Correlation-Id` | ⬜ | ID de trazabilidad del flujo |
| `X-Consumer` | ⬜ | Identificador del consumidor |
| `Authorization` | ⬜* | JWT del Grupo 2 — requerido para intents personales |

*Requerido cuando el intent es personal (pedidos, pagos, despacho, notificaciones).

**Body:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "¿Dónde está mi pedido ORD-1001?",
  "context": {
    "user_id": "USR-01"
  }
}
```

**Response 200:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "response": "Tu pedido ORD-1001 está EN_TRÁNSITO. Total: $15990.",
  "intent_detected": "order_status",
  "sources_consulted": ["order-service"],
  "correlation_id": "660e8400-e29b-41d4-a716-446655440111",
  "timestamp": "2026-06-24T21:00:00.000Z"
}
```

---

### 5.3 GET /chat/session/{session_id}

Retorna el historial completo de mensajes de una sesión.

| Campo | Valor |
|---|---|
| Método | `GET` |
| URL | `/chat/session/{session_id}` |
| Auth | `X-Api-Key` obligatorio |
| Router | `routers/sessionRouter.js` |

**Response 200:** objeto `Session` completo (ver sección 4.2).

**Response 404:**
```json
{
  "status": 404,
  "code": "SESSION_NOT_FOUND",
  "message": "No existe una sesion con el ID proporcionado."
}
```

---

### 5.4 GET /chat/faq/{category}

Retorna preguntas frecuentes por categoría (generadas por Gemini o desde fallbacks locales).

| Campo | Valor |
|---|---|
| Método | `GET` |
| URL | `/chat/faq/{category}` |
| Auth | `X-Api-Key` obligatorio |
| Router | `routers/faqRouter.js` |

**Categorías válidas:**

| Categoría | Contenido |
|---|---|
| `faq_envios` | Tiempos, zonas y seguimiento de despacho |
| `faq_pagos` | Métodos de pago, reembolsos y cuotas |
| `faq_cuenta` | Registro, contraseña y gestión de cuenta |
| `faq_productos` | Catálogo, devoluciones y garantías |

**Response 200:**
```json
{
  "category": "faq_pagos",
  "items": [
    {
      "question": "¿Cuáles son los métodos de pago?",
      "answer": "Aceptamos tarjetas de débito, crédito y transferencia bancaria."
    }
  ],
  "generated_at": "2026-06-24T21:00:00.000Z",
  "correlationId": "..."
}
```

---

## 6. Intents soportados

| Intent | Servicios consultados | JWT requerido |
|---|---|---|
| `order_status` | Grupo 5 (pedidos) | ✅ Sí |
| `payment_status` | Grupo 5 + Grupo 6 (pagos) | ✅ Sí |
| `shipping_status` | Grupo 5 + Grupo 8 (despacho) | ✅ Sí |
| `notifications` | Grupo 9 (notificaciones) | ✅ Sí |
| `product_info` | Grupo 3 (catálogo) | ❌ No |
| `stock_info` | Grupo 3 + Grupo 7 (inventario) | ❌ No |
| `faq` | Solo Gemini / fallback local | ❌ No |
| `unknown` | Ninguno — respuesta genérica | ❌ No |

---

## 7. Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `PORT` | Puerto del servidor | `3000` |
| `CHATBOT_API_KEY` | API Key para proteger los endpoints | `mk-chatbot-abc123xyz` |
| `GEMINI_API_KEY` | Clave de Google AI Studio | *(vacío — usa fallback)* |
| `GEMINI_MODEL` | Modelo de Gemini a usar | `gemini-2.0-flash-lite` |
| `GEMINI_ENABLED` | Activar/desactivar Gemini | `true` |
| `MOCK_MODE` | Usar datos simulados en vez de APIs reales | `true` |
| `AUTH_SERVICE_URL` | URL del Grupo 2 | *(vacío)* |
| `CATALOG_SERVICE_URL` | URL del Grupo 3 | *(vacío)* |
| `ORDER_SERVICE_URL` | URL del Grupo 5 | *(vacío)* |
| `PAYMENT_SERVICE_URL` | URL del Grupo 6 | *(vacío)* |
| `INVENTORY_SERVICE_URL` | URL del Grupo 7 | *(vacío)* |
| `SHIPPING_SERVICE_URL` | URL del Grupo 8 | *(vacío)* |
| `NOTIFICATION_SERVICE_URL` | URL del Grupo 9 | *(vacío)* |
| `REPORTING_SERVICE_URL` | URL del Grupo 10 | *(vacío)* |

---

## 8. Cómo probar con Postman

La colección oficial está en:
```
postman/chatbot-service.postman_collection.json
```

### Pasos para importar:
1. Abrir **Postman**
2. Click en **Import** (botón arriba a la izquierda)
3. Arrastrar el archivo `chatbot-service.postman_collection.json` o usar "Upload files"
4. La colección aparece en el panel izquierdo como **"Grupo 11 — Chatbot Service"**

### Variables de la colección:

| Variable | Default | Cuándo cambiar |
|---|---|---|
| `base_url` | `http://localhost:3000` | Cambiar a URL de Render en E3 |
| `api_key` | `mk-chatbot-abc123xyz` | Si se cambia `CHATBOT_API_KEY` en `.env` |
| `session_id` | UUID predeterminado | Copiar del campo `session_id` de la respuesta del primer POST |

### Flujo de prueba recomendado:
1. **01 - Verificar salud** → debe retornar `status: "ok"` o `"degraded"`
2. **02 - Chat: consulta pedido** → retorna estado del pedido ORD-1001
3. **03 - Chat: consulta stock** → retorna stock de Pescas (sin JWT)
4. **05 - Obtener historial de sesión** → debe mostrar los 2 turnos anteriores
5. **06 - FAQ pagos** → lista de FAQs de pagos

---

## 9. Cómo integrar como otro grupo

Si eres otro grupo y quieres llamar al chatbot-service, aquí el contrato mínimo:

```http
POST http://localhost:3000/chat/message
X-Api-Key: mk-chatbot-abc123xyz
X-Request-Id: <UUID único>
X-Correlation-Id: <UUID de tu flujo>
X-Consumer: <nombre-de-tu-servicio>
Content-Type: application/json

{
  "session_id": "<UUID de sesión>",
  "message": "¿Hay stock del producto PROD-01?",
  "context": {
    "user_id": null
  }
}
```

El chatbot retorna:
```json
{
  "session_id": "...",
  "response": "Sí, PROD-01 está disponible con 15 unidades.",
  "intent_detected": "stock_info",
  "sources_consulted": ["catalog-service", "inventory-service"],
  "correlation_id": "...",
  "timestamp": "..."
}
```

---

## 10. Mock vs. modo real

| Modo | Configuración | Comportamiento |
|---|---|---|
| **Mock (E2)** | `MOCK_MODE=true` (default) | Usa `infrastructure/mockData.js` en vez de llamar a los grupos reales |
| **Real (E3+)** | `MOCK_MODE=false` + URLs en `.env` | Llama a las APIs reales de G2, G3, G5, G6, G7, G8, G9 |

Cuando `MOCK_MODE=true`, los datos simulados son:
- **Usuario:** USR-01, rol customer
- **Productos:** PROD-01 (Pescas, $15990), PROD-02 (Audífonos, $24990)
- **Pedido activo:** ORD-1001 (EN_TRANSITO, $15990)
- **Pago:** PAY-1001 (APPROVED)
- **Despacho:** TRK-CL-1001 (EN_TRANSITO, ETA: 2026-06-24)

---

*Grupo 11 — Mini Marketplace Cloud — Proyecto Integrado Cloud*
