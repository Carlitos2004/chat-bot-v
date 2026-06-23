# Logica del chatbot

El proyecto sigue la logica de los entregables, pero no incluye esos archivos dentro del proyecto final.

## Capas

- `public/`: interfaz visual del chatbot.
- `src/app.js`: rutas HTTP y endpoints REST.
- `src/application/`: logica de negocio del chatbot.
- `src/infrastructure/`: conexion con Gemini, APIs externas, mocks y almacenamiento temporal.

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
POST /chat/message
GET /chat/session/{session_id}
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

Los headers salen hacia los otros grupos desde `src/infrastructure/apiAdapters.js`.
