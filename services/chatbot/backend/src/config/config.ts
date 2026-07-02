import dotenv from 'dotenv';

dotenv.config();

function boolEnv(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export const config = {
  port: Number(process.env.PORT ?? 3010), // Recuerda que tu puerto oficial es 3010
  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? "",
    model: process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite",
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
    reporting: process.env.REPORTING_SERVICE_URL ?? ""
  },
};
