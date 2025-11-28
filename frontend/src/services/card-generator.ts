import { z } from 'zod';
import type { DraftEntry, GeneratedCard } from '@/lib/db';
import { apiPath, extractErrorMessage, parseJsonOrThrow } from './api';

const CARD_GENERATION_ENDPOINT = apiPath('/api/cards/generate');

const generatedCardSchema = z.object({
  noteType: z.enum(['EN: Default', 'PL: Default', 'PL: Verb']),
  fields: z.record(z.string(), z.unknown()),
  schemaName: z.string(),
  generatedAt: z.string(),
});

export async function generateCardPayload({
  draft,
}: {
  draft: DraftEntry;
}): Promise<GeneratedCard> {
  const response = await fetch(CARD_GENERATION_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ draft }),
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    throw new Error(`Card generation request failed: ${response.status} ${message}`);
  }

  const payload = await parseJsonOrThrow<unknown>(
    response,
    'Card generation API returned invalid JSON',
  );
  return generatedCardSchema.parse(payload);
}
