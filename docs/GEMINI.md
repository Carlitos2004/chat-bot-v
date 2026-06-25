# Conexion con Gemini

El chatbot no tiene una "API de Gemini" propia. Tiene una API REST local y, por dentro, llama a Gemini usando una API key.

## Archivos importantes

- `backend/src/services/gemini.service.ts`: hace la llamada real a Gemini por HTTPS usando `fetch` nativo.
- `backend/src/controllers/chat.controller.ts`: orquesta la llamada a Gemini, arma el prompt y maneja las respuestas fallback de respaldo.
- `scripts/set-gemini-key.ps1`: crea el archivo `.env` con tu API key. No contiene respuestas del chatbot.

## Como se conecta

Flujo:

```text
Usuario -> frontend/app.js -> POST /chat -> chat.controller.ts -> gemini.service.ts -> Gemini API
```

Si Gemini no tiene cuota gratis o falla, `chat.controller.ts` usa una respuesta local construida con los datos mock o con las APIs reales de otros grupos.

## Donde va la clave

La clave va en `.env`:

```env
GEMINI_API_KEY=tu_clave
GEMINI_ENABLED=true
```

Ese archivo no se sube a GitHub y no se debe pegar en el frontend.
