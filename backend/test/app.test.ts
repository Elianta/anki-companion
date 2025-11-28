import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp, OpenAIClient } from "../src/app.js";

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
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("validates translation payload", async () => {
    const app = createApp({ openaiClient: createMockOpenAI() });
    const res = await request(app).post("/api/translations").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid translation request/i);
  });

  it("rejects translation requests without OPENAI_API_KEY", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/translations")
      .send({ rawInput: "zamek", sourceLanguage: "pl" });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/OPENAI_API_KEY/i);
  });

  it("forwards translation requests to OpenAI client and returns parsed entry", async () => {
    const translationEntry = {
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
    const app = createApp({ openaiClient });

    const res = await request(app)
      .post("/api/translations")
      .send({ rawInput: translationEntry.raw_input, sourceLanguage: "pl" });

    expect(res.status).toBe(200);
    expect(openaiClient.chat.completions.create).toHaveBeenCalledTimes(1);
    const [payload] = openaiClient.chat.completions.create.mock.calls[0];

    expect(payload.model).toBe("gpt-4.1-mini");
    expect(payload.temperature).toBe(0.2);
    expect(payload.response_format?.json_schema?.name).toBe(
      "simple_translation_entry_pl"
    );
    expect(payload.messages?.[0]?.role).toBe("system");
    expect(payload.messages?.[1]).toEqual({
      role: "user",
      content: translationEntry.raw_input,
    });
    expect(res.body).toEqual(translationEntry);
  });

  it("returns error when OpenAI translation response is invalid", async () => {
    const openaiClient = createMockOpenAI({
      ...mockCompletionResponse,
      choices: [{ message: { role: "assistant", content: "not-json" } }],
    });
    const app = createApp({ openaiClient });

    const res = await request(app)
      .post("/api/translations")
      .send({ rawInput: "zamek", sourceLanguage: "pl" });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/unable to parse/i);
  });

  it("validates card generation payload", async () => {
    const app = createApp({ openaiClient: createMockOpenAI() });
    const res = await request(app).post("/api/cards/generate").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid card generation request/i);
  });

  it("rejects card generation without OPENAI_API_KEY", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/cards/generate")
      .send({
        draft: {
          term: "zamek",
          language: "PL",
          noteType: "PL: Default",
          sense: { id: "sense-1", translationRU: "замок" },
        },
      });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/OPENAI_API_KEY/i);
  });

  it("forwards card generation requests to OpenAI client and returns generated card", async () => {
    const cardFields = {
      Word: "zamek",
      Definition: "drzwiowy mechanizm zamykający",
      Translation: "замок",
      Example1: "Zamknij zamek.",
      Example1Spaces: "Zamknij _____",
      Example1RU: "Закрой замок.",
      Example2: "Zamek był zepsuty.",
      Example2Spaces: "_____ był zepsuty.",
      Example2RU: "Замок был сломан.",
      Synonym: "",
      Antonym: "",
    };

    const openaiClient = createMockOpenAI({
      ...mockCompletionResponse,
      choices: [
        { message: { role: "assistant", content: JSON.stringify(cardFields) } },
      ],
    });
    const app = createApp({ openaiClient });

    const res = await request(app)
      .post("/api/cards/generate")
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
    expect(openaiClient.chat.completions.create).toHaveBeenCalledTimes(1);
    const [payload] = openaiClient.chat.completions.create.mock.calls[0];

    expect(payload.response_format?.json_schema?.name).toBe("pl_default_note");
    expect(payload.messages?.[0]?.content).toContain("Note type: PL: Default");
    expect(res.body).toMatchObject({
      noteType: "PL: Default",
      fields: cardFields,
      schemaName: "pl_default_note",
    });
    expect(typeof res.body.generatedAt).toBe("string");
  });

  it("returns error when OpenAI card response is invalid", async () => {
    const openaiClient = createMockOpenAI({
      ...mockCompletionResponse,
      choices: [{ message: { role: "assistant", content: "invalid-json" } }],
    });
    const app = createApp({ openaiClient });

    const res = await request(app)
      .post("/api/cards/generate")
      .send({
        draft: {
          term: "zamek",
          language: "PL",
          noteType: "PL: Default",
          sense: { id: "sense-1", translationRU: "замок" },
        },
      });

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/unable to parse/i);
  });
});
