import cors from "cors";
import express from "express";
import type OpenAI from "openai";
import {
  requestTranslationFromOpenAI,
  translationRequestSchema,
} from "./translations.js";
import { cardRequestSchema, generateCardFromOpenAI } from "./cards.js";
import z from "zod";

export type OpenAIClient = Pick<OpenAI, "chat">;

type CreateAppOptions = {
  openaiClient?: OpenAIClient;
  allowedOrigins?: string[];
};

export function createApp(options: CreateAppOptions = {}) {
  const { openaiClient, allowedOrigins } = options;
  const app = express();

  const corsOrigin =
    allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : true;
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/translations", async (req, res) => {
    if (!openaiClient) {
      return res.status(500).json({ error: "Server missing OPENAI_API_KEY" });
    }

    const parsedBody = translationRequestSchema.safeParse(req.body ?? {});
    if (!parsedBody.success) {
      return res.status(400).json({
        error: "Invalid translation request",
        details: z.treeifyError(parsedBody.error),
      });
    }

    const { rawInput, sourceLanguage } = parsedBody.data;

    try {
      const entry = await requestTranslationFromOpenAI(
        openaiClient,
        rawInput,
        sourceLanguage
      );
      return res.json(entry);
    } catch (error) {
      console.error("OpenAI translation request failed", error);
      const status = (error as { status?: number })?.status ?? 500;
      return res.status(status).json({
        error: (error as Error).message ?? "OpenAI translation failed",
      });
    }
  });

  app.post("/api/cards/generate", async (req, res) => {
    if (!openaiClient) {
      return res.status(500).json({ error: "Server missing OPENAI_API_KEY" });
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
      const card = await generateCardFromOpenAI(openaiClient, draft);
      return res.json(card);
    } catch (error) {
      console.error("OpenAI card generation failed", error);
      const status = (error as { status?: number })?.status ?? 500;
      return res.status(status).json({
        error: (error as Error).message ?? "OpenAI card generation failed",
      });
    }
  });

  return app;
}
