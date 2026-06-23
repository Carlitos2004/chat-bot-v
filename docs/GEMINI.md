# Conexion con Gemini

El chatbot no tiene una "API de Gemini" propia. Tiene una API REST local y, por dentro, llama a Gemini usando una API key.

## Archivos importantes

- `src/infrastructure/geminiClient.js`: hace la llamada real a Gemini por HTTPS.
- `src/application/processMessage.js`: decide cuando llamar a Gemini y cuando usar fallback local.
- `src/application/responseBuilder.js`: arma el prompt y las respuestas de respaldo.
- `scripts/set-gemini-key.ps1`: crea el archivo `.env` con tu API key. No contiene respuestas del chatbot.

## Como se conecta

Flujo:

```text
Usuario -> public/app.js -> POST /chat/message -> processMessage.js -> geminiClient.js -> Gemini API
```

Si Gemini no tiene cuota gratis o falla, `processMessage.js` usa una respuesta local construida con los datos mock o con las APIs reales de otros grupos.

## Donde va la clave

La clave va en `.env`:

```env
GEMINI_API_KEY=tu_clave
GEMINI_ENABLED=true
```

Ese archivo no se sube a GitHub y no se debe pegar en el frontend.
