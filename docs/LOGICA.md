# Logica del chatbot

El proyecto sigue la logica de los entregables, pero no incluye esos archivos dentro del proyecto final.

## Capas

- `frontend/`: interfaz visual del chatbot.
- `backend/src/app.ts`: rutas HTTP y configuración de Express.
- `backend/src/controllers/`: controladores que reciben las peticiones de Express.
- `backend/src/middlewares/`: validaciones globales como `X-Api-Key`.
- `backend/src/models/`: interfaces y tipos de TypeScript para la consistencia de datos.
- `backend/src/services/`: lógica de negocio, intents, Gemini API, almacenamiento en memoria y adaptadores.

## Intents soportados

- `order_status`: estado de pedido.
- `payment_status`: estado de pago.
- `shipping_status`: estado de despacho.
- `product_info`: informacion de producto.
- `stock_info`: disponibilidad de stock.
- `notifications`: notificaciones del usuario.
- `faq`: preguntas frecuentes.

## Endpoints propios

```text
POST /chat
GET /chat/sessions/:sessionId
GET /chat/faq/:category
GET /health
GET /
```

## Headers de trazabilidad

El chatbot recibe y propaga:

```text
X-Request-Id
X-Correlation-Id
X-Consumer: chatbot-service
Authorization: Bearer JWT
```

Los headers salen hacia los otros grupos desde `backend/src/services/upstreamMocks.service.ts`.
