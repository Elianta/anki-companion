import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { OpenAILLMClient } from "../src/llm/openai-adapter.js";
import { OpenAIClient, type LLMClient } from "../src/types.js";
import { type GeneratedCard } from "../src/cards.js";
import { type SimpleTranslationEntry } from "../src/translations.js";

const translationEntry: SimpleTranslationEntry = {
  raw_input: "zamek [do drzwi]",
  source_word: "zamek",
  source_language: "pl",
  target_language: "ru",
  senses: [
    {
      translation: "замок",
      part_of_speech: "noun",
      sense_note: "дверной механизм",
      usage_frequency: {
        level: "high",
        comment: "часто используется",
      },
      examples: [
        { pl: "Zamknij zamek.", ru: "Закрой замок." },
        { pl: "Zamek był zepsuty.", ru: "Замок был сломан." },
      ],
    },
  ],
};

const cardFields = {
  Word: "zamek",
  Definition: "drzwiowy mechanizm zamykający",
  Translation: "замок",
  Example1: "Zamknij zamek.",
  Example1Spaces: "Zamknij _____",
  Example1RU: "Закрой замок.",
  Example2: "Zamek был zepsuty.",
  Example2Spaces: "_____ был zepsuty.",
  Example2RU: "Замок был сломан.",
  Synonym: "",
  Antonym: "",
};

const baseCard: GeneratedCard = {
  noteType: "PL: Default",
  fields: cardFields,
  schemaName: "pl_default_note",
  generatedAt: "2024-01-01T00:00:00.000Z",
};

const createMockLLMClient = (
  overrides: Partial<LLMClient> & {
    translationResult?: unknown;
    cardResult?: unknown;
  } = {}
): LLMClient => {
  const translate =
    overrides.translate ??
    (vi
      .fn()
      .mockResolvedValue(
        (overrides.translationResult ??
          translationEntry) as SimpleTranslationEntry
      ) as LLMClient["translate"]);
  const generateCard =
    overrides.generateCard ??
    (vi
      .fn()
      .mockResolvedValue(
        (overrides.cardResult ?? baseCard) as GeneratedCard
      ) as LLMClient["generateCard"]);

  return { translate, generateCard };
};

const mockCompletionResponse = {
  choices: [{ message: { role: "assistant", content: "Hello!" } }],
  model: "gpt-4o-mini",
  usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
};

type MockOpenAIClient = OpenAIClient & {
  chat: {
    completions: {
      create: ReturnType<typeof vi.fn>;
    };
  };
};

const createMockOpenAI = (
  completion = mockCompletionResponse
): MockOpenAIClient => {
  const create = vi.fn().mockResolvedValue(completion);
  return {
    chat: {
      completions: {
        create,
      },
    },
  } as MockOpenAIClient;
};

describe("createApp", () => {
  it("returns health status", async () => {
    const app = createApp();
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("validates translation payload", async () => {
    const app = createApp({ llmClient: createMockLLMClient() });
    const res = await request(app).post("/api/translations").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid translation request/i);
  });

  it("rejects translation requests without an LLM client", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/translations")
      .send({ rawInput: "zamek", sourceLanguage: "pl" });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/missing LLM provider/i);
  });

  it("forwards translation requests to the LLM client and returns parsed entry", async () => {
    const llmClient = createMockLLMClient();
    const app = createApp({ llmClient });

    const res = await request(app)
      .post("/api/translations")
      .send({ rawInput: translationEntry.raw_input, sourceLanguage: "pl" });

    expect(res.status).toBe(200);
    expect(llmClient.translate).toHaveBeenCalledWith({
      rawInput: translationEntry.raw_input,
      sourceLanguage: "pl",
    });
    expect(res.body).toEqual(translationEntry);
  });

  it("returns error when translation generation fails", async () => {
    const translate = vi
      .fn()
      .mockRejectedValue(new Error("translation failure"));
    const llmClient = createMockLLMClient({ translate });
    const app = createApp({ llmClient });

    const res = await request(app)
      .post("/api/translations")
      .send({ rawInput: "zamek", sourceLanguage: "pl" });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/translation failure/i);
  });

  it("validates card generation payload", async () => {
    const app = createApp({ llmClient: createMockLLMClient() });
    const res = await request(app).post("/api/cards-generate").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid card generation request/i);
  });

  it("rejects card generation without an LLM client", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/cards-generate")
      .send({
        draft: {
          term: "zamek",
          language: "PL",
          noteType: "PL: Default",
          sense: { id: "sense-1", translationRU: "замок" },
        },
      });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/missing LLM provider/i);
  });

  it("forwards card generation requests to the LLM client", async () => {
    const llmClient = createMockLLMClient();
    const app = createApp({ llmClient });

    const res = await request(app)
      .post("/api/cards-generate")
      .send({
        draft: {
          term: "zamek",
          language: "PL",
          noteType: "PL: Default",
          sense: {
            id: "sense-1",
            translationRU: "замок",
            notes: "door lock",
            partOfSpeech: "noun",
          },
        },
      });

    expect(res.status).toBe(200);
    expect(llmClient.generateCard).toHaveBeenCalledWith({
      term: "zamek",
      language: "PL",
      noteType: "PL: Default",
      sense: {
        id: "sense-1",
        translationRU: "замок",
        notes: "door lock",
        partOfSpeech: "noun",
      },
    });
    expect(res.body).toMatchObject({
      noteType: "PL: Default",
      fields: cardFields,
      schemaName: "pl_default_note",
    });
  });

  it("returns error when card generation fails", async () => {
    const generateCard = vi.fn().mockRejectedValue(new Error("card failure"));
    const llmClient = createMockLLMClient({ generateCard });
    const app = createApp({ llmClient });

    const res = await request(app)
      .post("/api/cards-generate")
      .send({
        draft: {
          term: "zamek",
          language: "PL",
          noteType: "PL: Default",
          sense: { id: "sense-1", translationRU: "замок" },
        },
      });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/card failure/i);
  });
});

describe("OpenAILLMClient", () => {
  it("builds translation payloads with schemas and parses results", async () => {
    const openaiClient = createMockOpenAI({
      ...mockCompletionResponse,
      choices: [
        {
          message: {
            role: "assistant",
            content: JSON.stringify(translationEntry),
          },
        },
      ],
    });

    const adapter = new OpenAILLMClient({
      client: openaiClient,
      model: "gpt-test",
    });

    const entry = await adapter.translate({
      rawInput: translationEntry.raw_input,
      sourceLanguage: "pl",
    });

    expect(openaiClient.chat.completions.create).toHaveBeenCalledTimes(1);
    const [payload] = openaiClient.chat.completions.create.mock.calls[0];

    expect(payload.model).toBe("gpt-test");
    expect(payload.temperature).toBe(0.2);
    expect(payload.response_format?.json_schema?.name).toBe(
      "simple_translation_entry_pl"
    );
    expect(payload.messages?.[0]?.role).toBe("system");
    expect(payload.messages?.[1]).toEqual({
      role: "user",
      content: translationEntry.raw_input,
    });
    expect(entry).toEqual(translationEntry);
  });

  it("builds card payloads and validates responses", async () => {
    const openaiClient = createMockOpenAI({
      ...mockCompletionResponse,
      choices: [
        { message: { role: "assistant", content: JSON.stringify(cardFields) } },
      ],
    });
    const adapter = new OpenAILLMClient({
      client: openaiClient,
      model: "gpt-test",
    });

    const card = await adapter.generateCard({
      term: "zamek",
      language: "PL",
      noteType: "PL: Default",
      sense: {
        id: "sense-1",
        translationRU: "замок",
        notes: "door lock",
        partOfSpeech: "noun",
      },
    });

    expect(openaiClient.chat.completions.create).toHaveBeenCalledTimes(1);
    const [payload] = openaiClient.chat.completions.create.mock.calls[0];

    expect(payload.response_format?.json_schema?.name).toBe("pl_default_note");
    expect(payload.messages?.[0]?.content).toContain("Note type: PL: Default");
    expect(card).toMatchObject({
      noteType: "PL: Default",
      fields: cardFields,
      schemaName: "pl_default_note",
    });
  });

  it("throws when OpenAI returns invalid JSON", async () => {
    const openaiClient = createMockOpenAI({
      ...mockCompletionResponse,
      choices: [{ message: { role: "assistant", content: "not-json" } }],
    });
    const adapter = new OpenAILLMClient({
      client: openaiClient,
      model: "gpt-test",
    });

    await expect(
      adapter.translate({ rawInput: "zamek", sourceLanguage: "pl" })
    ).rejects.toThrow(/Unable to parse OpenAI response/i);
  });
});
