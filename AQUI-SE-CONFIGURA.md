# Aqui se configura el chatbot

Este archivo es la guia corta para no perderse en el proyecto.

## 1. Como se inicia

En Visual Studio Code abre esta carpeta y ejecuta:

```powershell
npm run dev
```

La terminal mostrara un link, por ejemplo:

```text
http://localhost:3000
```

Aprieta ese link para abrir el chatbot.

Si el puerto esta ocupado, puede mostrar:

```text
http://localhost:3001
```

Usa siempre el link que salga en la terminal.

## 2. Gemini

Gemini no esta en `public/` ni en `scripts/`.

La conexion real con Gemini esta aqui:

```text
src/infrastructure/geminiClient.js
```

El chatbot llama a Gemini desde:

```text
src/application/processMessage.js
```

Para activar Gemini necesitas crear un archivo `.env` en la raiz del proyecto:

```env
GEMINI_API_KEY=tu_clave_de_google_ai_studio
GEMINI_MODEL=gemini-2.0-flash-lite
GEMINI_ENABLED=true
MOCK_MODE=true
```

Tambien puedes crear ese `.env` con:

```powershell
.\scripts\set-gemini-key.ps1
```

Ese script no contiene respuestas. Solo guarda la clave de Gemini en `.env`.

Si no hay `.env`, no hay clave o Gemini no tiene cuota gratis, el chatbot responde con fallback local.

## 3. APIs de otros grupos

Las APIs de otros grupos NO se agregan en Gemini.

Se agregan en `.env`:

```env
AUTH_SERVICE_URL=https://api-grupo-2
CATALOG_SERVICE_URL=https://api-grupo-3
ORDER_SERVICE_URL=https://api-grupo-5
PAYMENT_SERVICE_URL=https://api-grupo-6
INVENTORY_SERVICE_URL=https://api-grupo-7
SHIPPING_SERVICE_URL=https://api-grupo-8
NOTIFICATION_SERVICE_URL=https://api-grupo-9
REPORTING_SERVICE_URL=https://api-grupo-10
MOCK_MODE=false
```

Luego, si el endpoint o la respuesta de un grupo es distinta, se modifica aqui:

```text
src/infrastructure/apiAdapters.js
```

Ejemplo: si el Grupo 3 te manda la API de catalogo, pones su URL en:

```env
CATALOG_SERVICE_URL=https://url-real-del-catalogo
```

Y si el contrato no es exactamente `GET /products`, se ajusta en:

```text
src/infrastructure/apiAdapters.js
```

## 4. Datos falsos actuales

Mientras no tengamos APIs reales, el chatbot usa datos falsos de:

```text
src/infrastructure/mockData.js
```

Ahi estan productos, stock, pedidos, pagos, despacho y notificaciones de prueba.

## 5. Logica principal

- `public/`: pantalla visual.
- `src/app.js`: rutas HTTP.
- `src/application/intentDetector.js`: detecta si el usuario pregunta por pedido, pago, stock, etc.
- `src/application/processMessage.js`: decide que servicio consultar.
- `src/application/responseBuilder.js`: arma la respuesta si Gemini no funciona.
- `src/infrastructure/geminiClient.js`: llamada real a Gemini.
- `src/infrastructure/apiAdapters.js`: llamadas reales a los grupos.
- `src/infrastructure/mockData.js`: datos falsos de prueba.
