import { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { getFaq } from "../services/faq.service.js";

const VALID_FAQ_CATEGORIES = [
  "faq_envios",
  "faq_pagos",
  "faq_productos",
  "faq_cuenta",
  "faq_devoluciones",
];

export async function getFaqList(req: Request, res: Response) {
  const correlationId =
    (req.headers["x-correlation-id"] as string) ||
    (req.headers["x-request-id"] as string) ||
    randomUUID();
  const { category } = req.params;

  if (!VALID_FAQ_CATEGORIES.includes(category)) {
    return res.status(400).json({
      timestamp: new Date().toISOString(),
      status: 400,
      code: "INVALID_FAQ_CATEGORY",
      message: `La categoría '${category}' no es válida. Use: ${VALID_FAQ_CATEGORIES.join(
        ", "
      )}.`,
      correlationId,
    });
  }

  const faqResult = await getFaq({ category, correlationId });
  return res.status(200).json(faqResult);
}