# Grupo 11 - Chatbot Service

API local del chatbot de soporte para Mini Marketplace Cloud.

## Que hace

- Incluye interfaz web visual en `http://localhost:3000`.
- Expone `POST /chat`.
- Expone `GET /chat/sessions/{sessionId}`.
- Detecta intents principales del contrato: pedidos, pagos, despacho, productos, stock, notificaciones y FAQ.
- Usa Gemini por REST cuando `GEMINI_API_KEY` esta configurada.
- Usa respuestas locales de respaldo si Gemini falla o no hay clave.
- Usa mocks de los otros grupos mientras falten URLs reales.

## Tecnologias segun la arquitectura

- Backend: Node.js (>=20), TypeScript, Express 4.
- API: REST con endpoints `/chat` y `/chat/sessions/{sessionId}`.
- IA: Gemini API (gemini-2.0-flash-lite), opcional mientras exista cuota gratis.
- Persistencia final esperada: Supabase PostgreSQL.
- Integraciones externas: G2, G3, G5, G6, G7, G8, G9 y G10.
- Despliegue esperado: Render.com o equivalente.

Esta version local no incluye los documentos de arquitectura, pero implementa su logica: intents, trazabilidad, headers, mocks por grupo y fallback.

## Configuracion

Para usarlo sin Gemini, no necesitas configurar nada.

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
  -Uri "http://localhost:3000/chat/message" `
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
