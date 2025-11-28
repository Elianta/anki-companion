import OpenAI from "openai";
import { z } from "zod";
import { getCardSchema, type DraftNoteType } from "./card-schemas.js";
import { OPENAI_MODEL } from "./translations.js";

type LangPair = "EN" | "PL";

type Sense = {
  id: string;
  translationRU: string;
  notes?: string;
  partOfSpeech?: string;
  usageLevel?: "low" | "medium" | "high";
  frequencyNotes?: string;
  examples?: string[];
};

type DraftEntry = {
  term: string;
  language: LangPair;
  noteType: DraftNoteType;
  sense: Sense;
};

export const cardRequestSchema = z.object({
  draft: z.object({
    term: z.string().min(1),
    language: z.enum(["EN", "PL"]),
    noteType: z.enum(["EN: Default", "PL: Default", "PL: Verb"]),
    sense: z.object({
      id: z.string().min(1),
      translationRU: z.string().min(1),
      notes: z.string().optional(),
      partOfSpeech: z.string().optional(),
      usageLevel: z.enum(["low", "medium", "high"]).optional(),
      frequencyNotes: z.string().optional(),
      examples: z.array(z.string()).optional(),
    }),
  }),
});

export type CardRequest = z.infer<typeof cardRequestSchema>;

export type GeneratedCard = {
  noteType: DraftNoteType;
  fields: Record<string, unknown>;
  schemaName: string;
  generatedAt: string;
};

type OpenAIClient = Pick<InstanceType<typeof OpenAI>, "chat">;

const buildCardSystemPrompt = (noteType: DraftNoteType, guidance: string) => {
  return `You are an assistant that prepares structured Anki notes.
Note type: ${noteType}.
Goal: Fill every field from the schema provided to you while staying faithful to the selected sense.
Guidance: ${guidance}
Rules:
1. Never invent meanings outside the supplied translation or sense note.
2. Always output valid JSON only (no markdown or extra commentary).
3. Use concise, natural sentences and keep languages consistent.`;
};

const buildCardUserPrompt = (draft: DraftEntry) => {
  return `Source word: ${draft.term}
Language: ${draft.language === "PL" ? "Polish" : "English"}
Sense translation (Ru): ${draft.sense.translationRU}
Sense note: ${draft.sense.notes ?? "Not provided"}
Part of speech: ${draft.sense.partOfSpeech ?? "Unknown"}
`;
};

export async function generateCardFromOpenAI(
  openaiClient: OpenAIClient,
  draft: DraftEntry
): Promise<GeneratedCard> {
  const schemaDefinition = getCardSchema(draft.noteType);
  if (!schemaDefinition) {
    throw new Error(`Unsupported note type: ${draft.noteType}`);
  }

  const systemPrompt = buildCardSystemPrompt(
    draft.noteType,
    schemaDefinition.systemPrompt
  );
  const userPrompt = buildCardUserPrompt(draft);

  const completion = await openaiClient.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.2,
    response_format: {
      type: "json_schema",
      json_schema: schemaDefinition.jsonSchema,
    },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = completion.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

  let parsedFields: unknown;
  try {
    parsedFields = JSON.parse(content);
  } catch {
    throw new Error("Unable to parse OpenAI response");
  }

  const fields = schemaDefinition.validator.parse(parsedFields);

  return {
    noteType: draft.noteType,
    fields,
    schemaName: schemaDefinition.name,
    generatedAt: new Date().toISOString(),
  };
}
