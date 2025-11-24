import type { DraftEntry, DraftNoteType, GeneratedCard } from '@/lib/db';
import { getCardSchema } from '@/services/card-schemas';
import { OPENAI_MODEL, requestJsonCompletion } from '@/services/openai';

const buildCardSystemPrompt = (
  noteType: DraftNoteType,
  guidance: string,
) => `You are an assistant that prepares structured Anki notes.
Note type: ${noteType}.
Goal: Fill every field from the schema provided to you while staying faithful to the selected sense.
Guidance: ${guidance}
Rules:
1. Never invent meanings outside the supplied translation or sense note.
2. Always output valid JSON only (no markdown or extra commentary).
3. Use concise, natural sentences and keep languages consistent.`;

const buildCardUserPrompt = (draft: DraftEntry) => {
  return `Source word: ${draft.term}
Language: ${draft.language === 'PL' ? 'Polish' : 'English'}
Sense translation (Ru): ${draft.sense.translationRU}
Sense note: ${draft.sense.notes ?? 'Not provided'}
Part of speech: ${draft.sense.partOfSpeech ?? 'Unknown'}
`;
};

type GenerateCardPayloadParams = {
  draft: DraftEntry;
};

export async function generateCardPayload({
  draft,
}: GenerateCardPayloadParams): Promise<GeneratedCard> {
  const schemaDefinition = getCardSchema(draft.noteType);
  if (!schemaDefinition) {
    throw new Error(`Unsupported note type: ${draft.noteType}`);
  }

  const systemPrompt = buildCardSystemPrompt(draft.noteType, schemaDefinition.systemPrompt);
  const userPrompt = buildCardUserPrompt(draft);

  const content = await requestJsonCompletion({
    model: OPENAI_MODEL,
    temperature: 0.2,
    response_format: {
      type: 'json_schema',
      json_schema: schemaDefinition.jsonSchema,
    },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  const parsedFields = JSON.parse(content);
  const fields = schemaDefinition.validator.parse(parsedFields);
  console.log('Generated fields:', fields);

  return {
    noteType: draft.noteType,
    fields,
    schemaName: schemaDefinition.name,
    generatedAt: new Date().toISOString(),
  };
}
