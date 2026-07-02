# Grupo 11 - Chatbot Service

Este microservicio actúa como la capa de atención, orquestación e integración conversacional del ecosistema Mini Marketplace Cloud. Su responsabilidad principal es interactuar con los clientes utilizando lenguaje natural (IA) para resolver consultas de catálogo, stock, estados de órdenes, pagos, envíos y FAQs generales, conectando flujos complejos mediante llamadas backend-to-backend a los microservicios de los otros grupos (G2-G9).

---

## 📄 Contrato API y Evidencia de Evolución Documentada

El diseño y especificación de la API se gestiona mediante un contrato estricto bajo el estándar OpenAPI 3.0.3.

* **Enlace al Contrato YAML:** [contrato-chatbot-service-REST-v1_2.yaml](file:///c:/Users/carlo/OneDrive/Desktop/chat-bot-v-main/docs/contrato-chatbot-service-REST-v1_2.yaml) (Puedes importar este archivo directamente en [Swagger Editor](https://editor.swagger.io/) para visualizarlo como Swagger UI).

### Historial de Versiones (Evolución Documentada)
Para evidenciar la maduración y evolución del diseño del servicio, el contrato ha pasado por las siguientes fases documentadas:
* **v1.0 (Diseño Inicial - Fase Contractual):** Definición conceptual de los endpoints de mensajería básica e integración conceptual de respuestas estáticas (Mocks locales).
* **v1.1 (Fase de Integración Temprana):** Incorporación de seguridad obligatoria por headers (`X-Api-Key`), headers de trazabilidad (`X-Correlation-Id`, `X-Request-Id`), y estandarización del formato de respuesta de errores (404/500).
* **v1.2 (Fase Cloud - Versión Actual):** Incorporación de persistencia real en la nube con Supabase (PostgreSQL), corrección de consistencia de rutas según el contrato (`/chat/message` y `/chat/session/{session_id}` en singular), e integración del monitoreo de base de datos activa dentro de `/health`.

---

## 🛠️ Stack Tecnológico
* **Backend:** Node.js (versión 20+), TypeScript, Express.
* **Seguridad:** Middleware de autenticación por API Key y paso de JWT Bearer Token.
* **Base de Datos (Persistencia):** Supabase (PostgreSQL).
* **IA Motor:** Google Gemini API (`Gemini 3.1 Flash Lite`).
* **CI/CD:** GitHub Actions (Integración) + Render.com (Despliegue Continuo).

---

## 🚀 Cómo Instalar

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Carlitos2004/chat-bot-v.git
   cd chat-bot-v
   ```
2. **Instalar las dependencias de Node.js:**
   Ingresa a la carpeta del backend e instala las librerías requeridas:
   ```bash
   cd backend
   npm install
   ```

---

## 🔑 Variables de Entorno Requeridas

Crea un archivo `.env` en la raíz de la carpeta `backend` (puedes guiarte con [.env.example](file:///c:/Users/carlo/OneDrive/Desktop/chat-bot-v-main/.env.example)). Configura las siguientes variables:

| Variable | Tipo / Valor sugerido | Descripción |
|---|---|---|
| `PORT` | `3010` | Puerto en el que corre el servidor Express localmente. |
| `OPEN_BROWSER` | `true` o `false` | Indica si abre automáticamente el chatbot en el navegador al iniciar. |
| `CHATBOT_API_KEY` | `mk-chatbot-abc123xyz` | Clave secreta que se compara en el header `X-Api-Key`. |
| `GEMINI_API_KEY` | Tu API Key de Google AI Studio | Clave para realizar peticiones al modelo conversacional de Gemini. |
| `GEMINI_MODEL` | `gemini-3.1-flash-lite` | Modelo de IA conversacional utilizado. |
| `GEMINI_ENABLED` | `true` | Habilita o deshabilita las llamadas a la API de Gemini. |
| `SUPABASE_URL` | URL de tu proyecto Supabase | Endpoint REST de tu base de datos Supabase. |
| `SUPABASE_ANON_KEY` | Anon Key de Supabase | Clave pública de autenticación para Supabase. |
| `MOCK_MODE` | `false` o `true` | `false` para conectar a las APIs reales de otros grupos; `true` para usar mocks locales. |

### Variables de URLs de otros grupos (G2 - G9)
Cuando los demás grupos entreguen sus servicios, completa estas variables en el `.env` (si se dejan vacías y `MOCK_MODE=false`, el chatbot usará simulaciones inteligentes para no fallar):
* `AUTH_SERVICE_URL` (G2 - Autenticación)
* `CATALOG_SERVICE_URL` (G3 - Catálogo de productos)
* `ORDER_SERVICE_URL` (G5 - Pedidos)
* `PAYMENT_SERVICE_URL` (G6 - Pagos)
* `INVENTORY_SERVICE_URL` (G7 - Inventario/Stock)
* `SHIPPING_SERVICE_URL` (G8 - Despachos y Logística)
* `NOTIFICATION_SERVICE_URL` (G9 - Notificaciones)
* `REPORTING_SERVICE_URL` (Reportería y analítica)

---

## 💻 Cómo Correr Localmente

### 1. Iniciar en Modo Desarrollo (TypeScript watch)
Este comando compila en tiempo real y detecta cualquier cambio que realices en el código:
```bash
cd backend
npm run dev
```

### 2. Compilar el Proyecto (TypeScript -> JavaScript)
Genera la carpeta `dist/` con el código JavaScript optimizado:
```bash
npm run build
```

### 3. Iniciar en Modo Producción (Local)
Levanta la versión compilada:
```bash
npm start
```

### 4. Ejecutar Pruebas de Humo (Smoke Tests)
Ejecuta una serie de peticiones automatizadas de prueba contra los endpoints del servidor local para validar que todo esté operando correctamente:
```bash
# Asegúrate de tener el servidor corriendo localmente en el puerto 3010 antes de ejecutar
$env:CHATBOT_BASE_URL="http://localhost:3010"; node ../scripts/smoke-test.mjs
```

---

## 🛣️ Endpoints Disponibles (Alineados al Contrato)

El servicio implementa los endpoints oficiales requeridos por el contrato y mantiene alias de compatibilidad para evitar romper el frontend visual actual:

| Método | Endpoint Oficial (Contrato) | Alias de Compatibilidad | Descripción | Seguridad |
|---|---|---|---|---|
| `POST` | `/chat/message` | `/chat` | Procesa un mensaje en lenguaje natural usando IA Gemini y devuelve respuesta estructurada. | Requiere `X-Api-Key` en headers. |
| `GET` | `/chat/session/{session_id}` | `/chat/sessions/{sessionId}` | Obtiene el historial completo de mensajes asociados a una sesión de chat directamente desde **Supabase**. | Requiere `X-Api-Key` en headers. |
| `GET` | `/chat/faq/{category}` | — | Retorna las preguntas y respuestas frecuentes de una categoría (`faq_envios`, `faq_pagos`, `faq_productos`, `faq_cuenta`). | Requiere `X-Api-Key` en headers. |
| `GET` | `/health` | — | Devuelve el estado operativo de salud del chatbot, la base de datos de Supabase y las dependencias del ecosistema. | Público (Sin autenticación). |

---

## 🚀 CI/CD Integrado

1. **Integración Continua (GitHub Actions):** Al hacer push o pull request a la rama `main`, la GitHub Action configurada en `.github/workflows/ci.yml` ejecuta automáticamente la instalación y compilación (`npm run build`) para verificar que no existan errores de código.
2. **Despliegue Continuo (Render.com CD):** Una vez que la compilación de GitHub Actions es exitosa y se aprueban los cambios en `main`, Render.com realiza el auto-deploy y publica la nueva versión de manera automática y sin intervención manual.
