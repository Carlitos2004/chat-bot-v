import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

function loadDotEnv(): void {
  const __dirname = resolve(fileURLToPath(import.meta.url), "..");
  const envPath = resolve(__dirname, "../../../.env");

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

function boolEnv(name: string, fallback: boolean): boolean {
  const value = process.env[name];

  if (value === undefined || value === "") {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export interface GeminiConfig {
  apiKey: string;
  model: string;
  enabled: boolean;
}

export interface ServicesConfig {
  auth: string;
  catalog: string;
  order: string;
  payment: string;
  inventory: string;
  shipping: string;
  notification: string;
  reporting: string;
}

export interface AppConfig {
  port: number;
  gemini: GeminiConfig;
  mockMode: boolean;
  services: ServicesConfig;
}

export const config: AppConfig = {
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
