import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { config } from "./config.js";
import { handleRequest } from "./app.js";

const server = createServer(handleRequest);
const maxPortAttempts = 10;

startServer(config.port, 0);

function startServer(port, attempt) {
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && attempt < maxPortAttempts) {
      const nextPort = port + 1;
      console.log(`El puerto ${port} esta ocupado. Intentando con ${nextPort}...`);
      startServer(nextPort, attempt + 1);
      return;
    }

    console.error("No se pudo iniciar el chatbot-service.");
    console.error(error.message);
    process.exit(1);
  });

  server.listen(port, () => {
    printStartup(port);
  });
}

function printStartup(port) {
  const url = `http://localhost:${port}`;
  console.log("chatbot-service iniciado");
  console.log(`Abre el chatbot visual aqui: ${url}`);
  console.log("Endpoints REST:");
  console.log(`  POST ${url}/chat/message`);
  console.log(`  GET  ${url}/chat/session/{session_id}`);

  if (shouldOpenBrowser()) {
    openBrowser(url);
  }
}

function shouldOpenBrowser() {
  return process.argv.includes("--open") && process.env.OPEN_BROWSER !== "false";
}

function openBrowser(url) {
  const platform = process.platform;
  const command =
    platform === "win32"
      ? ["cmd", ["/c", "start", "", url]]
      : platform === "darwin"
        ? ["open", [url]]
        : ["xdg-open", [url]];

  try {
    const child = spawn(command[0], command[1], {
      detached: true,
      stdio: "ignore",
    });
    child.unref();
  } catch {
    console.log(`No se pudo abrir el navegador automaticamente. Abre manualmente: ${url}`);
  }
}
