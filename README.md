# Grupo 11 - Chatbot Service

Este microservicio actúa como la capa de atención, orquestación e integración conversacional del ecosistema. Su responsabilidad principal es interactuar con los clientes del Marketplace utilizando lenguaje natural para resolver consultas de catálogo, stock, estados de órdenes, pagos y FAQs generales, centralizando flujos complejos mediante llamadas cruzadas a los demás grupos (G2-G9).

En esta fase actual, el proyecto implementa un Mock Funcional Inteligente alineado al contrato estricto para desbloquear las integraciones tempranas.

## Características (v1.1)
- **Interfaz Visual**: Incluida para pruebas en `http://localhost:3010`.
- **Endpoints Oficiales:**
  - `POST /chat`: Procesamiento de mensajes de lenguaje natural.
  - `GET /chat/sessions/{sessionId}`: Recuperación de historial conversacional.
  - `GET /chat/faq/{category}`: Consultas de preguntas frecuentes (categorizadas estrictamente en envíos, pagos, productos y despacho).
  - `GET /health`: Monitoreo de salud del servicio y dependencias.
- **Seguridad Obligatoria:** Requiere `X-Api-Key` en los headers de todas las peticiones.
- **Motor de IA:** Integración con Gemini API (`Gemini 3.1 Flash Lite`) por REST.
- **Resiliencia:** Uso de mocks locales de los otros grupos si fallan las integraciones o faltan URLs reales.

## Stack Tecnológico
- **Backend:** Node.js (>=20), TypeScript, Express.
- **Seguridad:** Middleware de validación de API Key y retransmisión de JWT.
- **Base de Datos:** Supabase (PostgreSQL).
- **Despliegue:** Render.com.

## Estructura del Proyecto
Se utiliza una arquitectura limpia basada en Express, eliminando el anidamiento innecesario:

- `src/app.ts` y `src/server.ts`: Configuración de Express y arranque del servidor.
- `src/routes/`: Definición de rutas (`/chat`, `/health`).
- `src/controllers/`: Lógica de entrada/salida HTTP.
- `src/middlewares/`: Interceptores de seguridad (ej. `auth.middleware.ts` para X-Api-Key).
- `src/services/`: Orquestador, conexión con Gemini y mocks de upstream (G2-G9).
- `src/models/`: Interfaces y DTOs fuertemente tipados.
- `frontend/`: Archivos estáticos de la interfaz web.
- `docs/`: Documentación interna (GEMINI.md, INTEGRACIONES.md).

## Configuración y ejecución
Para usarlo sin Gemini, no se configura nada.
Para conectarlo a Gemini:

1. Crea una clave en Google AI Studio.
2. Genera `.env` desde el script.

```powershell
.\scripts\set-gemini-key.ps1
```

3. Ejecuta la API:

```powershell
npm run dev
```

La API queda en:

```text
http://localhost:3000
```

Con `npm run dev` (que ejecuta `tsx watch backend/src/server.ts`), la terminal muestra el link para abrir el chatbot. El navegador no se abre automaticamente.
Si el puerto `3000` esta ocupado, el servidor intenta automaticamente con `3001`, `3002`, etc. Usa siempre el link que aparece en la terminal.

Si quieres que se abra el navegador automaticamente, usa:

```powershell
npm run open
```

Tambien puedes hacer doble clic en:

```text
abrir-chatbot.bat
```

Eso abre el navegador y levanta el servidor.

## Compilar / validar en Visual Studio Code

Abre la carpeta del proyecto y ejecuta:

```powershell
npm run build
```

Este comando compila todo el proyecto TypeScript usando `tsc` y genera la carpeta de salida `backend/dist/`.

Para ejecutar desde VS Code:

```powershell
npm run dev
```

O usa `Run and Debug` con la configuracion `Run chatbot`.

## Donde esta cada cosa

- Interfaz visual: `frontend/`.
- API REST y Servidor Express: `backend/src/app.ts` y `backend/src/server.ts`.
- Logica de intents y entidades: `backend/src/services/intent.service.ts`.
- Conexion con Gemini: `backend/src/services/gemini.service.ts`.
- Mocks y adaptadores de otros grupos: `backend/src/services/upstreamMocks.service.ts`.
- Persistencia de sesiones en memoria: `backend/src/services/sessionStore.service.ts`.
- Documentacion interna: `docs/`.

Lee especialmente:

```text
docs/GEMINI.md
docs/INTEGRACIONES.md
docs/LOGICA.md
```

## Probar

```powershell
npm run smoke
```

O con PowerShell:

```powershell
$body = @{
  session_id = "550e8400-e29b-41d4-a716-446655440000"
  message = "Donde esta mi pedido ORD-1001?"
  context = @{ user_id = "USR-01" }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/chat" `
  -ContentType "application/json" `
  -Headers @{
    "X-Request-Id" = "550e8400-e29b-41d4-a716-446655440001"
    "X-Correlation-Id" = "660e8400-e29b-41d4-a716-446655440111"
    "X-Consumer" = "chatbot-service"
  } `
  -Body $body
```

## Variables pendientes de otros grupos

Cuando cada grupo entregue su despliegue real, completar estas variables:

- `AUTH_SERVICE_URL`
- `CATALOG_SERVICE_URL`
- `ORDER_SERVICE_URL`
- `PAYMENT_SERVICE_URL`
- `INVENTORY_SERVICE_URL`
- `SHIPPING_SERVICE_URL`
- `NOTIFICATION_SERVICE_URL`
- `REPORTING_SERVICE_URL`

Mientras `MOCK_MODE=true`, la API responde con datos falsos controlados.
