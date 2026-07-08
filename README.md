# 🤖 Grupo 11 - Chatbot Service

Este microservicio actúa como la capa de **atención, orquestación e
integración conversacional** del ecosistema *Mini Marketplace Cloud*.

Su responsabilidad principal es poder interactuar con los clientes utilizando
lenguaje natural (IA) para resolver consultas sobre catálogo, stock,
estados de órdenes, pagos, envíos y FAQs generales, conectando flujos
complejos mediante llamadas backend-to-backend a los microservicios de
los otros grupos (G2-G9) y persistiendo el historial de conversaciones.

---

## 📄 Contrato API y Evolución Documentada

El diseño y especificación de la API se gestiona mediante un contrato
estricto bajo el estándar **OpenAPI 3.0.3**.

> [!NOTE]
> **Enlace al Contrato YAML**
> El archivo contractual completo se encuentra en:
> [contrato-chatbot-service-REST-v1_2.yaml](./docs/contrato-chatbot-service-REST-v1_2.yaml)
> *(Puedes importar este archivo en [Swagger Editor](https://editor.swagger.io/)
> para visualizarlo en Swagger UI)*.

### ⏳ Historial de Versiones (Evolución del Servicio)

Para evidenciar la maduración y evolución del diseño del servicio, el
contrato ha pasado por tres fases clave de desarrollo:

* **📝 v1.0 (Diseño Inicial - Fase Contractual):**
  * Definición conceptual de los endpoints de mensajería básica.
  * Respuestas estáticas simuladas (Mocks locales).
* **🔒 v1.1 (Fase de Integración Temprana):**
  * Seguridad obligatoria por headers (`X-Api-Key`).
  * Cabeceras de trazabilidad de solicitudes (`X-Correlation-Id`, `X-Request-Id`).
  * Estandarización de respuestas de error (`404` y `500`).
* **☁️ v1.2 (Fase Cloud - Versión Actual):**
  * Integración con persistencia real en la nube usando **Supabase (PostgreSQL)**.
  * Consistencia de rutas según diseño contractual (`/chat/message` y
    `/chat/session/{session_id}`).
  * Monitoreo de la base de datos activa dentro del endpoint `/health`.

---

## 🛠️ Stack Tecnológico

El servicio se encuentra construido sobre el siguiente stack de software:

* **Frontend (Interfaz Gráfica):** HTML5, CSS3 (Vanilla para diseño responsivo
  y moderno), JavaScript (Cliente para interactuar de forma asíncrona con el bot).
* **Backend (API):** Node.js (v20+), TypeScript, Express.js.
* **Persistencia (Base de Datos):** Supabase (Base de datos PostgreSQL en la nube).
* **Motor de IA:** Google Gemini API (`Gemini 3.1 Flash Lite`).
* **Seguridad:** Validación de API Key y paso de token JWT Bearer.
* **Integración/Despliegue Continuo (CI/CD):** GitHub Actions + Render.com.

---

## 🚀 Guía de Instalación Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/Carlitos2004/chat-bot-v.git
cd chat-bot-v
```

### 2. Instalar dependencias
Ingresa a la carpeta del backend e instala las librerías necesarias:
```bash
cd backend
npm install
```

### 3. Configurar Variables de Entorno
Crea un archivo `.env` en la raíz de la carpeta `backend` guiándote con
el archivo [.env.example](./.env.example).

| Variable | Tipo / Valor sugerido | Descripción |
| :--- | :--- | :--- |
| `PORT` | `3010` | Puerto local. |
| `OPEN_BROWSER` | `true` \| `false` | Abre el chatbot al iniciar. |
| `CHATBOT_API_KEY` | `mk-chatbot-abc123xyz` | Clave para `X-Api-Key`. |
| `GEMINI_API_KEY` | *(Tu API Key)* | Clave para llamadas a Gemini. |
| `GEMINI_MODEL` | `gemini-3.1-flash-lite` | Modelo de IA. |
| `GEMINI_ENABLED` | `true` | Habilita llamadas a Gemini. |
| `SUPABASE_URL` | *(URL de Supabase)* | Endpoint REST. |
| `SUPABASE_ANON_KEY`| *(Anon Key)* | Clave de acceso a Supabase. |
| `MOCK_MODE` | `false` | `false` para servicios reales. |

> [!TIP]
> **Integraciones de Microservicios Configurados:**
> Las siguientes variables corresponden a las URLs de producción y ya
> están completamente integradas:
> * `AUTH_SERVICE_URL` (G2 - Autenticación)
> * `CATALOG_SERVICE_URL` (G4 - Catálogo)
> * `ORDER_SERVICE_URL` (G5 - Pedidos)
> * `PAYMENT_SERVICE_URL` (G6 - Pagos)
> * `INVENTORY_SERVICE_URL` (G7 - Inventario y Stock)
> * `SHIPPING_SERVICE_URL` (G8 - Despachos)
> * `NOTIFICATION_SERVICE_URL` (G9 - Notificaciones)
> * `REPORTING_SERVICE_URL` (Reportería y Analítica)

---

## 💻 Ejecución del Proyecto

### Iniciar en Desarrollo (Live Reload)
```bash
npm run dev
```

### Compilar para Producción
```bash
npm run build
```

### Iniciar en Producción
```bash
npm start
```

### Pruebas de Humo (Smoke Tests)
Puedes validar rápidamente el funcionamiento de los endpoints ejecutando:
```bash
# Asegúrate de tener el servidor corriendo localmente en el puerto 3010
$env:CHATBOT_BASE_URL="http://localhost:3010"; node ../scripts/smoke-test.mjs
```

---

## 🛣️ Endpoints Disponibles (Alineados al Contrato)

El servicio responde exactamente al diseño OpenAPI v1.2 y mantiene alias:

| Método | Endpoint Oficial | Alias de Compatibilidad | Descripción |
| :---: | :--- | :--- | :--- |
| **POST** | `/chat/message` | `/chat` | Envía mensaje al chatbot. |
| **GET** | `/chat/session/{session_id}`| `/chat/sessions/{sessionId}`| Historial de la sesión. |
| **GET** | `/chat/faq/{category}` | — | FAQs por categoría. |
| **GET** | `/health` | — | Estado del servicio y DB. |

---

## 🔄 Pipeline CI/CD

1. **Integración Continua (CI):** Implementada con **GitHub Actions**
   (`.github/workflows/ci.yml`). Cada push a `main` desencadena la
   instalación limpia (`npm ci`) y compilación para evitar código roto.
2. **Despliegue Continuo (CD):** Conectado automáticamente con
   **Render.com**. Si la compilación es exitosa, se despliega solo.
