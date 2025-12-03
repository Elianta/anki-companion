import cors from "cors";
import express, { type RequestHandler } from "express";
import {
  translationRequestSchema,
  type TranslationRequest,
} from "./translations.js";
import { cardRequestSchema } from "./cards.js";
import z from "zod";
import { LLMClient } from "./types.js";
import { createLLMClientFromEnv } from "./llm/factory.js";
import { createRateLimitMiddleware } from "./rate-limit.js";

function parseAllowedOrigins(rawOrigins?: string) {
  return rawOrigins
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

type CreateAppOptions = {
  llmClient?: LLMClient;
  allowedOrigins?: string[];
  rateLimitMiddleware?: RequestHandler | null;
};

export function createApp(options: CreateAppOptions = {}) {
  const { llmClient, allowedOrigins, rateLimitMiddleware } = options;
  const app = express();

  const corsOrigin =
    allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : true;
  app.use(cors({ origin: corsOrigin }));
  if (rateLimitMiddleware) {
    app.use(rateLimitMiddleware);
  }
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/translations", async (req, res) => {
    if (!llmClient) {
      return res
        .status(500)
        .json({ error: "Server missing LLM provider configuration" });
    }

    const parsedBody = translationRequestSchema.safeParse(req.body ?? {});
    if (!parsedBody.success) {
      return res.status(400).json({
        error: "Invalid translation request",
        details: z.treeifyError(parsedBody.error),
      });
    }

    const { rawInput, sourceLanguage } = parsedBody.data;
    const requestPayload: TranslationRequest = { rawInput, sourceLanguage };

    try {
      const entry = await llmClient.translate(requestPayload);
      return res.json(entry);
    } catch (error) {
      console.error("LLM translation request failed", error);
      const status = (error as { status?: number })?.status ?? 500;
      return res.status(status).json({
        error: (error as Error).message ?? "LLM translation failed",
      });
    }
  });

  app.post("/api/cards/generate", async (req, res) => {
    if (!llmClient) {
      return res
        .status(500)
        .json({ error: "Server missing LLM provider configuration" });
    }

    const parsedBody = cardRequestSchema.safeParse(req.body ?? {});
    if (!parsedBody.success) {
      return res.status(400).json({
        error: "Invalid card generation request",
        details: parsedBody.error.flatten(),
      });
    }

    const { draft } = parsedBody.data;

    try {
      const card = await llmClient.generateCard(draft);
      return res.json(card);
    } catch (error) {
      console.error("LLM card generation failed", error);
      const status = (error as { status?: number })?.status ?? 500;
      return res.status(status).json({
        error: (error as Error).message ?? "LLM card generation failed",
      });
    }
  });

  return app;
}

export function buildAppFromEnv() {
  const allowedOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);

  const llmClient = createLLMClientFromEnv();
  const rateLimitMiddleware = createRateLimitMiddleware();

  return createApp({ llmClient, allowedOrigins, rateLimitMiddleware });
}
