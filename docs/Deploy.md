# 🚀 Despliegue en Render — Chatbot Service (Grupo 11)

Este documento detalla la infraestructura, variables y el flujo de
despliegue continuo en la nube para el microservicio del Chatbot.

---

## 🌐 Servicio Principal

> [!NOTE]
> **Enlaces en Render (Producción)**
> * **Chatbot Render (Frontend y Backend):**
>   [chat-bot-v-xzvi.onrender.com](https://chat-bot-v-xzvi.onrender.com)
> * **Monitoreo de salud (Health Check):**
>   [chat-bot-v-xzvi.onrender.com/health](https://chat-bot-v-xzvi.onrender.com/health)
> * **Contrato API (OpenAPI v1.2):**
>   [`contrato-chatbot-service-REST-v1_2.yaml`](./contrato-chatbot-service-REST-v1_2.yaml)

> [!IMPORTANT]
> **Comportamiento del Plan Free de Render**
> Debido a que se utiliza el plan gratuito de Render, la instancia se
> suspende automáticamente tras un período de inactividad. La primera
> petición realizada después de esto puede tardar **hasta 50 segundos**
> en responder mientras se activa el contenedor. Esto es un comportamiento
> normal del proveedor de hosting, no un fallo del microservicio.

---

## ⚙️ Configuración del Servidor en Render

La rama `main` del repositorio está conectada directamente con Render para
compilación y despliegue automáticos.

| Parámetro | Configuración en Render | Descripción |
| :--- | :--- | :--- |
| **Repositorio** | `https://github.com/Carlitos2004/chat-bot-v` | Código fuente |
| **Rama** | `main` | Rama productiva |
| **Root Dir** | `backend` | Directorio raíz |
| **Build Cmd** | `npm install && npm run build` | Compila TypeScript |
| **Start Cmd** | `node dist/server.js` | Levanta el servidor |
| **Auto-Deploy**| `On Commit` | Despliegue automático |

---

## 🔑 Variables de Entorno en Render

Las siguientes variables están configuradas de forma segura dentro del
Dashboard de Render (**chat-bot-v → Settings → Environment**).

### 1. Configuración de Núcleo (Core) y Base de Datos

| Variable | Valor | Descripción |
| :--- | :--- | :--- |
| `PORT` | `3010` | Puerto del servidor. |
| `GEMINI_MODEL` | `gemini-3.1-flash-lite` | Modelo de IA. |
| `MOCK_MODE` | `false` | Consume servicios reales. |
| `SUPABASE_URL` | `https://oegyyqennmidvzimnzbe.supabase.co` | URL base de Supabase. |
| `SUPABASE_ANON_KEY`| *(Configurada en Render)* | Llave anon de Supabase. |

---

## 🔌 Integraciones con Otros Microservicios (G2 - G9 + Reportería)

> [!TIP]
> **Estado de Integración: ¡100% Completado!** 🎉
> Todos los microservicios externos requeridos ya cuentan con sus URLs de
> producción configuradas y operando sin simulación (*mock*).

A continuación se detalla el mapeo y estado actual de las variables:

* **🟢 Grupo 2: Autenticación (AUTH_SERVICE_URL)**
  * **URL:** `https://auth-minimarket-cloud.onrender.com`
* **🟢 Grupo 4: Catálogo de Productos (CATALOG_SERVICE_URL)**
  * **URL:** `https://catalog-api-cm1l.onrender.com/api/v1/products`
* **🟢 Grupo 5: Gestión de Pedidos (ORDER_SERVICE_URL)**
  * **URL:** `https://pedidos-g5.onrender.com/`
* **🟢 Grupo 6: Pasarela de Pagos (PAYMENT_SERVICE_URL)**
  * **URL:** `https://payment-service-g6.onrender.com/api/payments`
* **🟢 Grupo 7: Control de Inventario y Stock (INVENTORY_SERVICE_URL)**
  * **URL:** `https://inventario-g7.onrender.com/`
* **🟢 Grupo 8: Despacho y Logística (SHIPPING_SERVICE_URL)**
  * **URL:** `https://arq-microservicio-de-despacho-y-logistica.onrender.com/health`
* **🟢 Grupo 9: Notificaciones (NOTIFICATION_SERVICE_URL)**
  * **URL:** `https://notification-service-i3bn.onrender.com/`
* **🟢 Reportería y Analítica (REPORTING_SERVICE_URL)**
  * **URL:** `https://fishmarket-45lw.onrender.com/`

---

## 🔄 Flujo de CI/CD (Integración y Despliegue Continuo)

El pipeline de despliegue opera automáticamente de la siguiente manera:

```
[ Git Commit & Push (main) ]
            │
            ▼
[ GitHub Actions (CI) ] ───► Ejecuta 'npm ci' y 'npm run build'
            │
      (Si es Exitoso)
            ▼
[ Render Auto-Deploy (CD) ] ───► Compila en la nube y publica
```

1. **GitHub Actions (CI):** Valida la calidad de código con cada push
   ejecutando compilaciones de prueba.
2. **Render Dashboard (CD):** Descarga los cambios, instala dependencias
   e inicia el servidor de producción automáticamente.

---

## ⚠️ Resolución de Problemas (Troubleshooting)

Si el deploy falla o el servicio no responde, revisa estos puntos comunes:

> [!WARNING]
> **Error `Cannot find module '../dist/server.js'`**
> * **Causa:** TypeScript no compiló a JavaScript en el build.
> * **Solución:** Asegurar que el Build Command en Render tenga `npm run build`.

> [!WARNING]
> **Error `supabaseUrl is required` o fallas de base de datos**
> * **Causa:** Variables de Supabase faltantes en el panel de Render.
> * **Solución:** Copiar las credenciales exactas del dashboard de Supabase.
