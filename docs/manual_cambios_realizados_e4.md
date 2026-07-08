# Manual de Cambios Realizados y Guía de Entregables (E4)
**Grupo 11 - Chatbot Service**

Este manual contiene el resumen de **todo lo que se implementó en el proyecto** para la entrega **E4 (Integración Sistémica)**, explicando en detalle de qué manera se resolvió cada uno de los entregables solicitados por el profesor en la rúbrica.

---

## 📋 Resumen Inicial de Cambios en el Repositorio

1. **Modificación de Configuración:** Se desactivó el modo de pruebas locales (`MOCK_MODE=false`) en el archivo `.env` del backend.
2. **Purga de Mocks:** Se vació la variable `mockData` en `upstreamMocks.service.ts` eliminando cualquier dato falso o duro (como `"pescas"`, `"ORD-1001"`, etc.).
3. **Robustez en Enrutamiento:** Se corrigió `joinUrl` para limpiar automáticamente sufijos `/health` y prevenir rutas duplicadas en las APIs reales.
4. **Mapeo de Contratos:** Se adaptó la lectura de datos de Catálogo (G3), Pagos (G6), Inventario (G7), Envíos (G8) y Notificaciones (G9) para soportar las estructuras reales de sus respuestas.
5. **Manejo de Tiempos de Espera:** Se configuraron timeouts de **8 segundos** mediante `AbortController` en el backend para evitar bloqueos si el servidor de un compañero se cae.
6. **Sistema de Logs Estructurados:** Se implementaron delimitadores de ciclo de vida (`INICIO DE ACCIÓN` / `FIN DE ACCIÓN`) y bloques unicode para trazabilidad.
7. **Pipeline de GitHub Actions:** Se añadió una prueba automática de seguridad (`npm audit --audit-level=critical`) en `.github/workflows/ci.yml`.
8. **Script de Pruebas Automáticas:** Se creó `scripts/integration-test.mjs` para verificar la integración.

---

## 📂 Detalle de los 5 Entregables del Excel

A continuación se detalla cómo fue resuelto cada entregable y dónde encontrar su evidencia:

### 1. 🌐 Flujo Integrado
* **De qué manera se hizo:** 
  Se configuraron los conectores HTTP del backend en `upstreamMocks.service.ts` para realizar peticiones reales a las URLs en la nube (Render) de tus compañeros, en lugar de simular respuestas locales.
  * **Conexión real establecida con:** Catálogo (G3), Pedidos (G5), Pagos (G6), Inventario (G7), Envíos (G8) y Notificaciones (G9).
  * **Corrección de URLs:** Se programó limpieza de rutas automática (ej. quitando el `/health` de despacho del G8 para llamar a `/v1/shipments`).
* **Cómo corroborar que funciona:**
  Al iniciar el servidor en local (`npm run dev`) y consultar por la caña de pescar, el Chatbot responde con el precio real de catálogo (`$89.990`) y su stock disponible (`15` unidades), datos extraídos en tiempo real por internet de los servidores de tus compañeros.

### 🧪 2. Pruebas de Integración
* **De qué manera se hizo:** 
  Se diseñaron dos métodos para ejecutar pruebas reales de integración:
  1. **Script de Consola:** Se creó el archivo `scripts/integration-test.mjs`, el cual realiza 6 consultas consecutivas al chatbot simulando preguntas de éxito (Catálogo, Stock) y errores controlados (Pedidos que no existen).
  2. **Colección de Postman:** El archivo de Postman en la carpeta `postman/` ya está preconfigurado con headers de trazabilidad (`X-Correlation-Id`, `X-Request-Id`).
* **Cómo corroborar que funciona:**
  Ejecutando en la consola de la raíz:
  `$env:CHATBOT_BASE_URL="http://localhost:3010"; node scripts/integration-test.mjs`
  Verás las respuestas del chatbot en texto y las llamadas de red pasando con éxito.

### 📄 3. Logs y Trazabilidad (Logs de Trazabilidad)
* **De qué manera se hizo:** 
  *(Nota: "Looks de trazabilidad" en el Excel hace referencia a "Logs de trazabilidad", es decir, el registro de la consola).*
  Se implementaron delimitadores de inicio y fin en `chat.controller.ts` y cajas en `upstreamMocks.service.ts` para agrupar todas las acciones gatilladas por un mensaje en la terminal:
  * **`======================= 📥 INICIO DE ACCIÓN / MENSAJE =======================`**: Marca el inicio de la petición.
  * **`======================= 📤 FIN DE ACCIÓN / MENSAJE (HTTP 200) =======================`**: Separa visualmente el fin de la transacción.
  * **Identificadores Clave:** Cada bloque muestra el `Correlation ID` (el identificador único de todo el flujo) y el `Request ID` (el identificador único de cada petición de red particular).
* **Cómo corroborar que funciona:**
  Al hacer una pregunta al bot, verás en la consola negra de tu servidor cómo el mismo `Correlation ID` (ej: `efa266de-83f9-4554-9dbe-60b9b2092d4a`) se repite tanto en la clasificación del mensaje como en la llamada a Catálogo y la de Inventario, demostrando el flujo de viaje único a través del ecosistema.

### 🗺️ 4. Diagrama Actualizado
* **De qué manera se hizo:** 
  Se actualizó el diseño de arquitectura física utilizando la sintaxis estándar de diagramas **Mermaid**. Este diagrama sitúa al Chatbot (Grupo 11) en el centro del ecosistema del Mini Marketplace, detallando las conexiones API REST hacia los grupos externos y la conexión PostgreSQL hacia Supabase.
* **Cómo visualizarlo:**
  Puedes ver la estructura y graficarla usando esta definición:
  ```mermaid
  graph TD
      Usuario([👤 Cliente / Chat UI]) <-->|HTTP / JSON| Chatbot[🤖 G11 - Chatbot Service]
      Chatbot <-->|PostgreSQL| Supabase[(Supabase DB - FAQs & Logs)]
      
      subgraph APIs del Ecosistema (Grupos Externos)
          Chatbot <-->|REST API| G3[📦 G3 - Catálogo]
          Chatbot <-->|REST API| G5[📝 G5 - Pedidos]
          Chatbot <-->|REST API| G6[💳 G6 - Pagos]
          Chatbot <-->|REST API| G7[📊 G7 - Inventario]
          Chatbot <-->|REST API| G8[🚚 G8 - Envíos]
          Chatbot <-->|REST API| G9[🔔 G9 - Notificaciones]
      end
  ```

### 🏆 5. Evidencia de Patrón Técnico
* **De qué manera se hizo:** 
  El patrón de tu chatbot es el **Orquestador Conversacional con LLM**. 
  * El chatbot actúa como la única puerta de entrada.
  * Recibe lenguaje natural del usuario (ej: *"¿Hay stock de la caña?"*).
  * El orquestador (Gemini) clasifica el mensaje (`detectIntent`) y extrae los datos clave (`extractEntities`).
  * Secuencialmente, el bot llama a Catálogo (G3) para conseguir el UUID del producto, y luego a Inventario G7 para validar el stock real.
* **Cómo corroborar que funciona:**
  La consola del servidor imprime la caja `🤖 [CLASIFICACIÓN DE INTENTO - GEMINI]` que muestra la entrada de texto limpio, el intento parseado y las entidades detectadas que gatillan la orquestación hacia las APIs.
  
 ### 6. Corrección de Bugs de Integración Real (Debugging E4)

Tras el despliegue inicial y con MOCK_MODE=false, se detectaron y corrigieron varios problemas de integración que solo aparecen al conectar con las APIs reales de los demás grupos (no eran visibles en modo mock, ya que los datos simulados nunca tienen estas inconsistencias). A continuación el detalle de cada bug, su causa y la solución aplicada.

6.1 Doble barra en URLs (joinUrl)


Síntoma: MODULE_NOT_FOUND / 404 al llamar a servicios cuya variable de entorno (ej. ORDER_SERVICE_URL) venía con / al final (https://pedidos-g5.onrender.com/), generando rutas con // que Express no matcheaba.
Solución: se agregó la función joinUrl(base, path) en upstreamMocks.service.ts, que limpia las barras finales de la base antes de concatenar el path. Se aplicó en todas las llamadas salientes del archivo.


6.2 Pedidos: búsqueda por UUID vs. orderNumber


Síntoma: G5 solo permite consultar por su UUID interno (GET /orders/{id}), pero el usuario suele escribir el número de pedido legible (ORD-XXXXXXXXXXXXX), que G5 no acepta directo y responde 400.
Solución: se agregó isUuid() para detectar el formato. Si el texto es UUID, se llama directo a GET /orders/{id}; si es un orderNumber, se lista GET /orders?userId=...&limit=... y se busca la coincidencia dentro del listado.


6.3 Inconsistencia de formato de campos entre endpoints de un mismo grupo


Síntoma: varios grupos devuelven camelCase en un endpoint y snake_case en otro del mismo servicio (ej. G5: GET /orders/{id} responde orderNumber/totalAmount, pero GET /orders responde order_number/total_amount). Sin normalizar, el texto de respuesta del bot mostraba $undefined.
Solución: se crearon funciones de normalización (normalizeOrder, normalizeInventory, normalizeShipment) que mapean ambos formatos a una única forma consistente antes de que el resto del código los use.


6.4 Endpoint de búsqueda de Catálogo (G3) incorrecto


Síntoma: el código llamaba a GET /products?q=..., pero ese endpoint es solo el listado paginado y no filtra por texto. El endpoint correcto según el contrato de G3 es GET /products/search?q=....
Solución: se corrigió findProduct() para usar /products/search, y se agregó lectura correcta de la respuesta paginada ({ data: [...], meta: {...} }), que antes se trataba erróneamente como un array plano.


6.5 Búsqueda de producto por UUID directo


Síntoma: si el usuario escribía directamente el UUID de un producto, el código lo trataba como texto de búsqueda en vez de ir directo al recurso, y la búsqueda por texto no encontraba coincidencias.
Solución: se agregó la misma lógica de detección de UUID (isUuid()) también en findProduct(), llamando directo a GET /products/{id} cuando corresponde.


6.6 Extracción de entidades: palabras de relleno pegadas a la consulta


Síntoma: frases naturales como "cuánto stock tienen de Señuelo Storm Gomoku" dejaban la palabra "tienen" pegada al inicio del productQuery ("tienen Señuelo Storm Gomoku"), porque la regex original exigía que la preposición (de/del/para) viniera inmediatamente después de la palabra clave (stock, producto, etc.). Esto rompía la búsqueda en el catálogo real.
Solución: se ajustó la regex en extractEntities() (intent.service.ts) para buscar la preposición en cualquier punto después de la palabra clave, no solo justo a continuación, saltándose palabras de relleno intermedias.


6.7 UUID mezclado con texto en el mensaje


Síntoma: en mensajes como "cuánto stock tienen de 1398de9b-c483-4ad1-805a-619e78453963", el UUID quedaba con palabras pegadas ("tienen 1398de9b-..."), fallando la validación estricta de isUuid().
Solución: se agregó una detección de UUID independiente, que busca el patrón UUID en cualquier parte del mensaje y lo usa directo como productQuery/orderId, sin pasar por la extracción de texto libre.


6.8 Parámetro de paginación incorrecto al listar pedidos


Síntoma: al buscar un pedido por orderNumber, el código pedía GET /orders?userId=...&size=50, pero la implementación real de G5 usa limit, no size. Al ignorar el parámetro desconocido, G5 devolvía solo los 10 pedidos más recientes por defecto, haciendo que pedidos más antiguos del mismo usuario no se encontraran.
Solución: se corrigió el parámetro a limit en la llamada a GET /orders.
Cómo corroborar que funciona:
Con MOCK_MODE=false, consultar en el chat: "cuánto stock tienen de Señuelo Storm Gomoku" devuelve el stock real (40 unidades) cruzando Catálogo (G3) → Inventario (G7) en una sola conversación, incluyendo frases con palabras de relleno y UUIDs directos.