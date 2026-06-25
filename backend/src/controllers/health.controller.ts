import { Request, Response } from "express";
import { config } from "../config/config.js";

export function getHealth(req: Request, res: Response) {
  const geminiStatus = config.gemini.apiKey ? "ok" : "error";
  const isMock = config.mockMode;

  const dependencyStatus = (url: string) =>
    url ? "ok" : isMock ? "ok (mock)" : "not_configured";

  return res.status(200).json({
    status: geminiStatus === "ok" ? "ok" : "degraded",
    version: "1.1",
    mock_mode: isMock,
    dependencies: {
      gemini: geminiStatus,
      auth_service: dependencyStatus(config.services.auth),
      catalog_service: dependencyStatus(config.services.catalog),
      order_service: dependencyStatus(config.services.order),
      payment_service: dependencyStatus(config.services.payment),
      inventory_service: dependencyStatus(config.services.inventory),
      shipment_service: dependencyStatus(config.services.shipping),
      notification_service: dependencyStatus(config.services.notification),
    },
    timestamp: new Date().toISOString(),
  });
}
