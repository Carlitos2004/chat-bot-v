# Guía Rápida de Configuración y Estructura del Chatbot

Esta es una guía sencilla para entender la estructura actual del proyecto, la integración que realizamos y las tareas pendientes para la entrega final.

---

## 1. Estructura Física del Proyecto (¿Qué es cada carpeta?)

Hemos organizado el proyecto en dos secciones muy claras para separar el cliente del servidor:

*   **`frontend/`**: Contiene la interfaz gráfica del chat. Aquí está el HTML, los estilos y la lógica del navegador (`app.js`).
*   **`backend/`**: Contiene el código de Node.js que procesa el chat, detecta las intenciones (intents), maneja la lógica de las preguntas frecuentes (FAQ) y se conecta con Gemini u otras APIs.
*   **`scripts/`**: Son **pequeños programas automatizados** de soporte. No son parte de la aplicación que ve el usuario, sino herramientas para el equipo de desarrollo:
    *   `build-check.mjs`: Verifica de forma automática que no haya errores de ortografía o de sintaxis en los archivos de código.
    *   `smoke-test.mjs` (Test de humo): Hace una simulación rápida enviando un mensaje de chat al servidor para comprobar si este responde correctamente sin necesidad de abrir el navegador.
    *   `set-gemini-key.ps1`: Un script de ayuda en PowerShell para crear el archivo `.env` fácilmente.

---

## 2. Lo que se integró del Repositorio de los Compañeros

Unimos la base del chatbot real con las especificaciones y la seguridad que definieron los compañeros en su esqueleto de la Fase 1 (`chatbot-service-main`):
1.  **Validación de `X-Api-Key`**: Se implementó un middleware de seguridad en `backend/src/app.js` que protege la API. Todas las rutas conversacionales exigen esta clave.
2.  **Endpoint de FAQ (`/chat/faq/:category`)**: Creamos el servicio [faqService.js](file:///c:/Users/carlo/OneDrive/Desktop/chat%20bot/backend/src/application/faqService.js) que responde preguntas frecuentes sobre envíos, pagos, cuentas y productos (las cuatro categorías del contrato).
3.  **Salud del Sistema (`/health`)**: Tu endpoint de salud ahora reporta el estado detallado de conexión de todas las dependencias del ecosistema.

---

## 3. ¿Qué falta por hacer y qué necesitamos de los otros grupos?

Para que el proyecto esté completo y pase de usar datos falsos a datos reales:

1.  **Obtener las URLs de las APIs de los otros grupos**:
    Cada grupo (G2 de Autenticación, G3 de Catálogo, G5 de Pedidos, etc.) desplegará su propio servidor. Cuando te entreguen sus direcciones de internet (por ejemplo, `https://catalogo-g3.render.com`), debes copiarlas en tu archivo `.env`.
2.  **Desactivar el Modo Mock**:
    Una vez configuradas las URLs de los otros grupos en tu archivo `.env`, cambia la variable `MOCK_MODE=true` a `MOCK_MODE=false`. A partir de ese momento, el chatbot llamará a sus APIs reales.
3.  **Base de Datos en Supabase (Persistencia)**:
    Si el docente exige persistencia final, faltaría conectar Supabase en `sessionStore.js` para registrar el historial de conversaciones de forma permanente en la base de datos PostgreSQL, en lugar de en la memoria RAM local.
4.  **Despliegue del Chatbot**:
    Subir todo este código a un servidor en la nube (como Render.com, tal como se especifica en su contrato OpenAPI).
