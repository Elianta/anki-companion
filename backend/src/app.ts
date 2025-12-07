import cors from "cors";
import express, { type RequestHandler } from "express";
import {
  translationRequestSchema,
  translationPayloadSchema,
  type TranslationRequest,
} from "./translations.js";
import { cardRequestSchema } from "./cards.js";
import z from "zod";
import { LLMClient, LLMModelConfig } from "./types.js";
import { createLLMClientFromEnv } from "./llm/factory.js";
import { createRateLimitMiddleware } from "./rate-limit.js";

function parseAllowedOrigins(rawOrigins?: string) {
  return rawOrigins
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

type CreateAppOptions = {
  llmClientFactory: (selection?: Partial<LLMModelConfig>) => LLMClient;
  allowedOrigins?: string[];
  rateLimitMiddleware?: RequestHandler | null;
};

export function createApp(options: CreateAppOptions) {
  const { llmClientFactory, allowedOrigins, rateLimitMiddleware } = options;
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
    const parsedBody = translationRequestSchema.safeParse(req.body ?? {});
    if (!parsedBody.success) {
      return res.status(400).json({
        error: "Invalid translation request",
        details: z.treeifyError(parsedBody.error),
      });
    }

    let client: LLMClient;

    try {
      client = llmClientFactory({
        provider: parsedBody.data.llmProvider,
        model: parsedBody.data.llmModel,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Server missing LLM provider configuration" });
    }

    const payload = translationPayloadSchema.parse(parsedBody.data);

    try {
      const entry = await client.translate(payload);
      return res.json(entry);
    } catch (error) {
      console.error("LLM translation request failed", error);
      const status = (error as { status?: number })?.status ?? 500;
      return res.status(status).json({
        error: (error as Error).message ?? "LLM translation failed",
      });
    }
  });

  app.post("/api/cards-generate", async (req, res) => {
    const parsedBody = cardRequestSchema.safeParse(req.body ?? {});
    if (!parsedBody.success) {
      return res.status(400).json({
        error: "Invalid card generation request",
        details: z.treeifyError(parsedBody.error),
      });
    }

    const { draft, llmModel, llmProvider } = parsedBody.data;
    let client: LLMClient;

    try {
      client = llmClientFactory({ provider: llmProvider, model: llmModel });
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Server missing LLM provider configuration" });
    }

    try {
      const card = await client.generateCard(draft);
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

  const llmClientFactory = (selection?: Partial<LLMModelConfig>) =>
    createLLMClientFromEnv(selection);
  const rateLimitMiddleware = createRateLimitMiddleware();

  return createApp({
    llmClientFactory,
    allowedOrigins,
    rateLimitMiddleware,
  });
}
