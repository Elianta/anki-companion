import { fetchEnglishTranslations, fetchPolishTranslations } from '@/services/openai';
import type { SimpleTranslationEntry } from '@/services/openai';

export type LangPair = 'EN' | 'PL';

export type Sense = {
  id: string;
  gloss: string;
  notes?: string;
};

export type DisambiguateResult = {
  term: string;
  langPair: LangPair;
  senses: Sense[];
};

const buildNotes = (sense: SimpleTranslationEntry['senses'][number]): string | undefined => {
  const parts: string[] = [];
  if (sense.sense_note) {
    parts.push(sense.sense_note);
  }
  if (sense.usage_frequency) {
    const freq = sense.usage_frequency.comment
      ? `${sense.usage_frequency.level} • ${sense.usage_frequency.comment}`
      : sense.usage_frequency.level;
    parts.push(`freq: ${freq}`);
  }
  return parts.length ? parts.join(' | ') : undefined;
};

const buildGloss = (sense: SimpleTranslationEntry['senses'][number]): string => {
  if (sense.part_of_speech) {
    return `${sense.translation} (${sense.part_of_speech})`;
  }
  return sense.translation;
};

const mapEntryToResult = (
  entry: SimpleTranslationEntry,
  langPair: LangPair,
): DisambiguateResult => ({
  term: entry.source_word,
  langPair,
  senses: (entry.senses ?? []).map((sense, index) => ({
    id: `${entry.source_word}-${index + 1}`,
    gloss: buildGloss(sense),
    notes: buildNotes(sense),
  })),
});

export async function disambiguate(term: string, langPair: LangPair): Promise<DisambiguateResult> {
  if (langPair === 'PL') {
    const entry = await fetchPolishTranslations(term);
    return mapEntryToResult(entry, langPair);
  }

  const entry = await fetchEnglishTranslations(term);
  return mapEntryToResult(entry, langPair);
}
