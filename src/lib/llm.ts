import { fetchEnglishTranslations, fetchPolishTranslations } from '@/services/openai';
import type { SimpleTranslationEntry } from '@/services/openai';

export type LangPair = 'EN' | 'PL';

export type Sense = {
  id: string;
  translationRU: string;
  notes?: string;
  partOfSpeech?: string;
  usageLevel?: 'low' | 'medium' | 'high';
  frequencyNotes?: string;
  examples?: string[];
};

export type DisambiguateResult = {
  term: string;
  langPair: LangPair;
  senses: Sense[];
};

const buildFrequencyNotes = (
  sense: SimpleTranslationEntry['senses'][number],
): string | undefined => {
  const level =
    sense.usage_frequency?.level === 'high'
      ? 'высокая'
      : sense.usage_frequency?.level === 'medium'
        ? 'средняя'
        : 'низкая';
  const levelStr = level ? `частота: ${level}` : undefined;
  const freq = sense.usage_frequency?.comment
    ? `${levelStr} • ${sense.usage_frequency.comment}`
    : levelStr;

  return freq;
};

const buildExamples = (sense: SimpleTranslationEntry['senses'][number]): string[] | undefined => {
  return sense.examples
    .map((example) => {
      if ('pl' in example) {
        return `${example.pl} — ${example.ru}`;
      }
      if ('en' in example) {
        return `${example.en} — ${example.ru}`;
      }
      return '';
    })
    .filter(Boolean);
};

const mapEntryToResult = (
  entry: SimpleTranslationEntry,
  langPair: LangPair,
): DisambiguateResult => ({
  term: entry.source_word,
  langPair,
  senses: (entry.senses ?? []).map((sense, index) => ({
    id: `${entry.source_word}-${index + 1}`,
    translationRU: sense.translation,
    notes: sense.sense_note || undefined,
    partOfSpeech: sense.part_of_speech || undefined,
    usageLevel: sense.usage_frequency?.level,
    frequencyNotes: buildFrequencyNotes(sense),
    examples: buildExamples(sense),
  })),
});

export async function disambiguate(term: string, langPair: LangPair): Promise<DisambiguateResult> {
  if (langPair === 'PL') {
    const entry = await fetchPolishTranslations(term);
    console.log('Polish entry:', entry);
    return mapEntryToResult(entry, langPair);
  }

  const entry = await fetchEnglishTranslations(term);
  console.log('English entry:', entry);
  return mapEntryToResult(entry, langPair);
}
