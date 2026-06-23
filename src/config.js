import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadDotEnv() {
  const envPath = resolve(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const index = trimmed.indexOf("=");
    if (index === -1) {
      continue;
    }

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

function boolEnv(name, fallback) {
  const value = process.env[name];

  if (value === undefined || value === "") {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? "",
    model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash-lite",
    enabled: boolEnv("GEMINI_ENABLED", true),
  },
  mockMode: boolEnv("MOCK_MODE", true),
  services: {
    auth: process.env.AUTH_SERVICE_URL ?? "",
    catalog: process.env.CATALOG_SERVICE_URL ?? "",
    order: process.env.ORDER_SERVICE_URL ?? "",
    payment: process.env.PAYMENT_SERVICE_URL ?? "",
    inventory: process.env.INVENTORY_SERVICE_URL ?? "",
    shipping: process.env.SHIPPING_SERVICE_URL ?? "",
    notification: process.env.NOTIFICATION_SERVICE_URL ?? "",
    reporting: process.env.REPORTING_SERVICE_URL ?? "",
  },
};
