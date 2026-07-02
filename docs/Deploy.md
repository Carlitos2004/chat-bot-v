# Deployment en Render — Chatbot Service (Grupo 11)

## URL en vivo

- **Servicio:** https://chat-bot-v-xzvi.onrender.com
- **Health check:** https://chat-bot-v-xzvi.onrender.com/health
- **Contrato REST:** [`contrato-chatbot-service-REST-v1_2.yaml`](./contrato-chatbot-service-REST-v1_2.yaml) (OpenAPI 3.0.3)

> ⚠️ El plan free de Render "duerme" la instancia tras un rato de inactividad. La primera petición después de eso puede demorar hasta 50 segundos en responder — es esperado, no un error.

---

## Repositorio y configuración de Render

| Configuración | Valor |
|---|---|
| Repositorio | `https://github.com/Carlitos2004/chat-bot-v` |
| Rama desplegada | `main` |
| Root Directory | `backend` |
| Build Command | `npm install && npm run build` |
| Start Command | `node dist/server.js` |
| Auto-Deploy | On Commit (se redepliega solo con cada push a `main`) |

El backend es un proyecto **TypeScript**, por lo que el Build Command corre `tsc` (via el script `build` del `package.json`) para compilar `src/` → `dist/` antes de arrancar el servidor con `node dist/server.js`.

---

## Variables de Entorno en Render

En **Render Dashboard → chat-bot-v → Settings → Environment**, configura las siguientes variables (obtén los valores desde tu proyecto de Supabase y Google AI Studio):

| Variable | Valor | Descripción |
| :--- | :--- | :--- |
| `PORT` | `3010` | Puerto en el que corre el microservicio localmente. |
| `GEMINI_MODEL` | `gemini-3.1-flash-lite` | Modelo de lenguaje natural utilizado por el chatbot. |
| `MOCK_MODE` | `false` | Modulo de pruebas apagado. El sistema consume servicios reales en producción. |
| `SUPABASE_URL` | `https://oegyyqennmidvzimnzbe.supabase.co` | URL del proyecto en Supabase para persistencia de datos. |
| `AUTH_SERVICE_URL` | `https://auth-minimarket-cloud.onrender.com` | Microservicio de Autenticación (Grupo 2). |
| `CATALOG_SERVICE_URL` | `https://catalog-api-cm1l.onrender.com/api/v1/products` | Microservicio de Catálogo de Productos (Grupo 4). |
| `ORDER_SERVICE_URL` | `https://pedidos-g5.onrender.com/` | Microservicio de Gestión de Pedidos (Grupo 5). |
| `PAYMENT_SERVICE_URL` | `https://payment-service-g6.onrender.com/api/payments` | Microservicio de Pasarela de Pagos (Grupo 6). |
| `INVENTORY_SERVICE_URL` | `https://inventario-g7.onrender.com` | Microservicio de Control de Inventario y Stock (Grupo 7). |
| `SHIPPING_SERVICE_URL` | `https://arq-microservicio-de-despacho-y-logistica.onrender.com` | Microservicio de Despacho y Logística (Grupo 8). |
| `NOTIFICATION_SERVICE_URL` | `https://notification-service-i3bn.onrender.com` | Microservicio de Notificaciones (Grupo 9). |

**IMPORTANTE:** nunca compartir estos valores ni subirlos a GitHub. El archivo `.env` está incluido en `.gitignore`; usa `.env.example` como referencia de los nombres de variables sin exponer valores reales.

### Variables pendientes de otros grupos

El proyecto opera actualmente como **Mock Funcional Inteligente**: mientras cada grupo entrega su URL real de despliegue, las siguientes variables se completan de forma incremental. Si no están configuradas, el chatbot usa los mocks locales de `upstreamMocks.service.ts` para esas integraciones (comportamiento intencional, no un error):

| Key | Grupo | Estado |
|---|---|---|
| `AUTH_SERVICE_URL` | G2 | ✅ Configurada en Render |
| `CATALOG_SERVICE_URL` | G3 | ✅ Configurada en Render |
| `ORDER_SERVICE_URL` | G5 | ✅ Configurada en Render |
| `PAYMENT_SERVICE_URL` | G6 | ✅ Configurada en Render |
| `INVENTORY_SERVICE_URL` | G7 | ✅ Configurada en Render |
| `SHIPPING_SERVICE_URL` | G8 | ✅ Configurada en Render |
| `NOTIFICATION_SERVICE_URL` | G9 | ✅ Configurada en Render |
| `REPORTING_SERVICE_URL` | — | Pendiente de URL final |

> **Nota sobre `X-Api-Key`:** la validación está implementada en `src/middlewares/auth.middleware.ts`, pero el nombre de la variable de entorno que lee para comparar la key aún no está confirmado ni configurada en Render. Pendiente de revisión en el código antes de documentarla y agregarla al dashboard.

---

## Flujo de Deploy

### 1. Push a GitHub (rama `main`)

```bash
git add .
git commit -m "mensaje descriptivo"
git push origin main
```

### 2. Render redeploy automático

Render detecta el push a `main` y redepliega automáticamente (Auto-Deploy: On Commit).

Alternativa manual: **Render Dashboard → chat-bot-v → Manual Deploy → Deploy latest commit**.

### 3. Verificar logs

Ve a **Render Dashboard → chat-bot-v → Logs** y busca la línea:

```
==> Your service is live 🎉
```

Si el deploy falla, revisa primero:
- Que `Root Directory` sea `backend` (no una ruta antigua tras una reestructuración del repo)
- Que las variables de entorno estén completas y sin errores tipográficos
- El log de build para errores de compilación de TypeScript

### 4. Probar la URL pública

```bash
curl https://chat-bot-v-xzvi.onrender.com/health
```

Respuesta esperada (`200 OK`):

```json
{
  "status": "ok",
  "version": "1.3",
  "dependencies": {
    "gemini": "ok",
    "auth_service": "ok",
    "catalog_service": "ok",
    "order_service": "ok",
    "payment_service": "ok",
    "inventory_service": "ok",
    "shipment_service": "ok",
    "notification_service": "ok"
  },
  "timestamp": "2026-07-01T00:00:00Z"
}
```

Luego prueba el endpoint principal del chatbot:

```bash
curl -X POST https://chat-bot-v-xzvi.onrender.com/chat/message \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: <tu-api-key>" \
  -d '{
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "¿Cuáles son los métodos de pago disponibles?",
    "context": { "user_id": null }
  }'
```

## Endpoints principales

| Método | Endpoint Oficial (Contrato OpenAPI) | Alias de Compatibilidad | Descripción | Auth |
|---|---|---|---|---|
| `POST` | `/chat/message` | `/chat` | Envía un mensaje al chatbot y recibe respuesta conversacional | `X-Api-Key` siempre; JWT para intents personalizados |
| `GET` | `/chat/session/{session_id}` | `/chat/sessions/{sessionId}` | Obtiene el historial de una sesión persistido en la base de datos (Supabase) | `X-Api-Key` + JWT |
| `GET` | `/chat/faq/{category}` | — | Preguntas frecuentes por categoría (`faq_envios`, `faq_pagos`, `faq_cuenta`, `faq_productos`) | `X-Api-Key`; JWT opcional |
| `GET` | `/health` | — | Estado de salud del servicio (incluyendo estado de Supabase y Gemini) | Sin autenticación |

> ✅ **Alineación con el Contrato:** Las rutas oficiales coinciden al 100% con el contrato OpenAPI (`contrato-chatbot-service-REST-v1_2.yaml`). Los alias de compatibilidad se mantienen activos para evitar romper el frontend visual actual.

---

## Flujo de CI/CD (Integración y Despliegue Continuo)

1. **Integración Continua (GitHub Actions):** Cada push o Pull Request a la rama `main` activa el workflow `.github/workflows/ci.yml`. Este pipeline ejecuta las siguientes tareas:
   - Configura Node.js v20.
   - Instala las dependencias del proyecto (`npm ci`).
   - Compila TypeScript (`npm run build`) para verificar que no haya errores de sintaxis o tipo.
2. **Despliegue Continuo (Render):** Render detecta el commit en `main` y realiza el auto-deploy (compilando y levantando la nueva versión automáticamente).

---

## Troubleshooting rápido

| Error en logs | Causa probable | Solución |
|---|---|---|
| `Cannot find module '.../dist/server.js'` | No se compiló TypeScript antes del start | Verificar que Build Command incluya `npm run build` |
| `Root directory '...' does not exist` | El repo cambió de estructura de carpetas y Render sigue apuntando a la ruta vieja | Actualizar **Root Directory** en Settings |
| `supabaseUrl is required` | Faltan variables de entorno de Supabase | Configurar `SUPABASE_URL` y `SUPABASE_ANON_KEY` en Environment |
