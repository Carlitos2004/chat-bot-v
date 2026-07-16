import { Request, Response } from "express";
import { config } from "../config/config.js";
import { supabase } from "../config/supabase.js";

export async function getHealth(req: Request, res: Response) {
  const geminiStatus = config.gemini.apiKey ? "ok" : "error";
  const isMock = config.mockMode;

  let supabaseStatus = "error";
  try {
    // Realizamos una consulta simple de verificación
    const { error } = await supabase
      .from("session")
      .select("sessionId")
      .limit(1);

    if (!error) {
      supabaseStatus = "ok";
    } else {
      console.warn("⚠️ Advertencia en verificación de Supabase en /health:", error.message);
    }
  } catch (err) {
    console.error("❌ Fallo de conexión con Supabase en /health:", err);
  }

  const dependencyStatus = (url: string) =>
    url ? "ok" : isMock ? "ok (mock)" : "not_configured";

  const overallStatus = (geminiStatus === "ok" && supabaseStatus === "ok") ? "ok" : "degraded";

  return res.status(200).json({
    status: overallStatus,
    version: "1.1",
    mock_mode: isMock,
    dependencies: {
      gemini: geminiStatus,
      supabase: supabaseStatus,
      auth_service: dependencyStatus(config.services.auth),
      catalog_service: dependencyStatus(config.services.catalog),
      order_service: dependencyStatus(config.services.order),
      payment_service: dependencyStatus(config.services.payment),
      inventory_service: dependencyStatus(config.services.inventory),
      shipment_service: dependencyStatus(config.services.shipping),
      notification_service: dependencyStatus(config.services.notification),
      reporting_service: dependencyStatus(config.services.reporting),
    },
    timestamp: new Date().toISOString(),
  });
}
