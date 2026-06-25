# Integraciones con otros grupos

Las dependencias reales de otros grupos se agregan en dos lugares.

## 1. URLs en `.env`

Cuando un grupo entregue su API, pega la URL base en `.env`:

```env
AUTH_SERVICE_URL=https://url-del-grupo-2
CATALOG_SERVICE_URL=https://url-del-grupo-3
ORDER_SERVICE_URL=https://url-del-grupo-5
PAYMENT_SERVICE_URL=https://url-del-grupo-6
INVENTORY_SERVICE_URL=https://url-del-grupo-7
SHIPPING_SERVICE_URL=https://url-del-grupo-8
NOTIFICATION_SERVICE_URL=https://url-del-grupo-9
REPORTING_SERVICE_URL=https://url-del-grupo-10
MOCK_MODE=false
```

Mientras `MOCK_MODE=true`, el chatbot usa datos falsos de prueba.

## 2. Adaptadores en `backend/src/services/upstreamMocks.service.ts`

Ese archivo contiene la lógica de llamadas y los fallbacks de mocks:

- G2 Identidad: `GET /auth/validate`
- G3 Catalogo: `GET /products` y `GET /products/{id}`
- G5 Pedidos: `GET /orders/{id}`
- G6 Pagos: `GET /payments?orderId=`
- G7 Inventario: `GET /inventory/{productId}`
- G8 Despacho: `GET /shipments?orderId=`
- G9 Notificaciones: `GET /notifications?userId=`

Si el contrato de un grupo cambia, se modifica ahí.

## Que pasa cuando agregas una API real

Ejemplo: si G3 entrega catalogo e inventario entrega stock:

```text
Usuario pregunta por stock
-> intent.service.ts detecta stock_info
-> chat.controller.ts pide producto al catalogo
-> upstreamMocks.service.ts llama a G3
-> upstreamMocks.service.ts llama a G7
-> Gemini o fallback redacta la respuesta
```

No tienes automaticamente la base de datos del otro grupo. Lo que tienes es acceso a su API. El chatbot consulta esa API y muestra los datos que esa API responda.
