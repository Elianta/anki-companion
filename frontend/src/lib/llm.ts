import { fetchEnglishTranslations, fetchPolishTranslations } from '@/services/translations';
import type { SimpleTranslationEntry } from '@/services/translations';

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
  let level: string | undefined;
  switch (sense.usage_frequency_level) {
    case 'high':
      level = 'высокая';
      break;
    case 'medium':
      level = 'средняя';
      break;
    case 'low':
      level = 'низкая';
      break;
    default:
      break;
  }
  const levelStr = level ? `частота: ${level}` : undefined;
  return levelStr;
};

const buildExamples = (sense: SimpleTranslationEntry['senses'][number]): string[] | undefined => {
  const examples = [];
  const { example_pl, example_en, example_ru } = sense;
  if (example_pl) {
    examples.push(`${example_pl} — ${example_ru}`);
  }
  if (example_en) {
    examples.push(`${example_en} — ${example_ru}`);
  }
  return examples;
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
    usageLevel: sense.usage_frequency_level,
    frequencyNotes: buildFrequencyNotes(sense),
    examples: buildExamples(sense),
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
