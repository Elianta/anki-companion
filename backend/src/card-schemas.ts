/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";

export type DraftNoteType =
  | "EN: Default"
  | "PL: Default"
  | "PL: Verbs"
  | "PL: Nouns"
  | "PL: Verbs Inf";

type FieldDefinition = {
  type: "string";
  description: string;
};

type FieldMap = Record<string, FieldDefinition>;

type CardSchemaDefinition = {
  name: string;
  systemPrompt: string;
  jsonSchema: {
    name: string;
    strict: true;
    schema: {
      type: "object";
      properties: Record<string, any>;
      required: string[];
      additionalProperties: false;
    };
  };
  validator: z.ZodObject<Record<string, any>>;
};

const stringField = (description: string): FieldDefinition => ({
  type: "string",
  description,
});

const buildValidator = (fields: FieldMap) => {
  const entries = Object.keys(fields).map((key) => [key, z.string()]);
  return z.object(Object.fromEntries(entries)).strict();
};

const createSchemaDefinition = (
  name: string,
  systemPrompt: string,
  fields: FieldMap,
): CardSchemaDefinition => ({
  name,
  systemPrompt,
  jsonSchema: {
    name,
    strict: true,
    schema: {
      type: "object",
      properties: fields,
      required: Object.keys(fields),
      additionalProperties: false,
    },
  },
  validator: buildValidator(fields),
});

const EXAMPLE_SENTENCE_GUIDANCE = `EXAMPLE SENTENCE QUALITY
    - Every example must stay semantically informative even if the target word is hidden with underscores.
    - The surrounding context should strongly narrow down the intended meaning and make the missing lemma reasonably guessable from context, not interchangeable with many unrelated words.
    - Prefer concrete situations, distinctive collocations, arguments, consequences, goals, or speaker intentions that point to this exact sense.
    - Avoid generic templates that remain too open after masking (for example, sentences where many common verbs or nouns would fit equally well).
    - If the source word is polysemous, the context must disambiguate the intended sense without relying on the visible target word itself.`;

const PL_DEFAULT_FIELDS: FieldMap = {
  Word: stringField("Source Polish word or phrase."),
  Definition: stringField("Polish definition that matches the provided sense."),
  Translation: stringField("Russian translation of the word or phrase."),
  Example1: stringField(
    "Polish sentence with the lemma exactly as supplied. If the lemma is a verb, keep its infinitive form.",
  ),
  Example1Spaces: stringField(
    "Example1 with the lemma replaced by underscores (one underscore per character, split groups for phrases).",
  ),
  Example1RU: stringField("Russian translation of Example1."),
  Example2: stringField(
    "Another Polish sentence with the same constraints as Example1.",
  ),
  Example2Spaces: stringField(
    "Example2 with the lemma replaced by underscores (one underscore per character, split groups for phrases).",
  ),
  Example2RU: stringField("Russian translation of Example2."),
  Synonym: stringField(
    "Polish synonym(s) if available separated by commas; otherwise an empty string.",
  ),
};

const PL_VERB_FIELDS: FieldMap = {
  Verb: stringField("Original Polish verb or chunk."),
  Definition: stringField("Polish definition matching the sense."),
  Translation: stringField("Russian translation of the verb."),
  Aspekt: stringField("Aspect: 'dokonany' or 'niedokonany'."),
  ParaAspektowa: stringField("Aspectual pair infinitive, or empty string."),
  FormJa: stringField("Present (ndk) or simple future (dk), 1sg (ja)."),
  ExampleFormJa: stringField("Sentence using FormJa."),
  FormTy: stringField("Present (ndk) or simple future (dk), 2sg (ty)."),
  ExampleFormTy: stringField("Sentence using FormTy."),
  FormOn: stringField("Present (ndk) or simple future (dk), 3sg masc (on)."),
  ExampleFormOn: stringField("Sentence using FormOn."),
  FormMy: stringField("Present (ndk) or simple future (dk), 1pl (my)."),
  ExampleFormMy: stringField("Sentence using FormMy."),
  FormWy: stringField("Present (ndk) or simple future (dk), 2pl (wy)."),
  ExampleFormWy: stringField("Sentence using FormWy."),
  FormOni: stringField("Present (ndk) or simple future (dk), 3pl masc (oni)."),
  ExampleFormOni: stringField("Sentence using FormOni."),
  FormMJaPrzeszly: stringField("Past tense, masculine 1sg (ja)."),
  ExampleFormMJaPrzeszly: stringField("Sentence using FormMJaPrzeszly."),
  FormMTyPrzeszly: stringField("Past tense, masculine 2sg (ty)."),
  ExampleFormMTyPrzeszly: stringField("Sentence using FormMTyPrzeszly."),
  FormMOnPrzeszly: stringField("Past tense, masculine 3sg (on)."),
  ExampleFormMOnPrzeszly: stringField("Sentence using FormMOnPrzeszly."),
  FormMMyPrzeszly: stringField("Past tense, masculine 1pl (my)."),
  ExampleFormMMyPrzeszly: stringField("Sentence using FormMMyPrzeszly."),
  FormMWyPrzeszly: stringField("Past tense, masculine 2pl (wy)."),
  ExampleFormMWyPrzeszly: stringField("Sentence using FormMWyPrzeszly."),
  FormMOniPrzeszly: stringField("Past tense, masculine 3pl (oni)."),
  ExampleFormMOniPrzeszly: stringField("Sentence using FormMOniPrzeszly."),
  FormZJaPrzeszly: stringField("Past tense, feminine 1sg (ja)."),
  ExampleFormZJaPrzeszly: stringField("Sentence using FormZJaPrzeszly."),
  FormZTyPrzeszly: stringField("Past tense, feminine 2sg (ty)."),
  ExampleFormZTyPrzeszly: stringField("Sentence using FormZTyPrzeszly."),
  FormZOnaPrzeszly: stringField("Past tense, feminine 3sg (ona)."),
  ExampleFormZOnaPrzeszly: stringField("Sentence using FormZOnaPrzeszly."),
  FormZMyPrzeszly: stringField("Past tense, feminine 1pl (my)."),
  ExampleFormZMyPrzeszly: stringField("Sentence using FormZMyPrzeszly."),
  FormZWyPrzeszly: stringField("Past tense, feminine 2pl (wy)."),
  ExampleFormZWyPrzeszly: stringField("Sentence using FormZWyPrzeszly."),
  FormZOnePrzeszly: stringField("Past tense, feminine 3pl (one)."),
  ExampleFormZOnePrzeszly: stringField("Sentence using FormZOnePrzeszly."),
};

const PL_NOUNS_FIELDS: FieldMap = {
  Word: stringField("Source Polish noun."),
  Definition: stringField("Polish definition matching the provided sense."),
  Translation: stringField("Russian translation of the noun."),
  Example1: stringField(
    "Polish sentence using the noun in the grammatically correct case.",
  ),
  Example1Spaces: stringField(
    "Example1 with the noun replaced by underscores (one underscore per character).",
  ),
  Example1RU: stringField("Russian translation of Example1."),
  Example2: stringField(
    "Another Polish sentence using the noun in the grammatically correct case.",
  ),
  Example2Spaces: stringField(
    "Example2 with the noun replaced by underscores (one underscore per character).",
  ),
  Example2RU: stringField("Russian translation of Example2."),
  FormLpM: stringField(
    "Singular nominative form (liczba pojedyncza, mianownik).",
  ),
  FormLpD: stringField(
    "Singular genitive form (liczba pojedyncza, dopełniacz).",
  ),
  FormLpC: stringField("Singular dative form (liczba pojedyncza, celownik)."),
  FormLpB: stringField(
    "Singular accusative form (liczba pojedyncza, biernik).",
  ),
  FormLpN: stringField(
    "Singular instrumental form (liczba pojedyncza, narzędnik).",
  ),
  FormLpMs: stringField(
    "Singular locative form (liczba pojedyncza, miejscownik).",
  ),
  FormLpW: stringField("Singular vocative form (liczba pojedyncza, wołacz)."),
  FormLmM: stringField("Plural nominative form (liczba mnoga, mianownik)."),
  FormLmD: stringField("Plural genitive form (liczba mnoga, dopełniacz)."),
  FormLmC: stringField("Plural dative form (liczba mnoga, celownik)."),
  FormLmB: stringField("Plural accusative form (liczba mnoga, biernik)."),
  FormLmN: stringField("Plural instrumental form (liczba mnoga, narzędnik)."),
  FormLmMs: stringField("Plural locative form (liczba mnoga, miejscownik)."),
  FormLmW: stringField("Plural vocative form (liczba mnoga, wołacz)."),
};

const PL_VERBS_INF_FIELDS: FieldMap = {
  Verb: stringField("Source Polish verb in infinitive."),
  Definition: stringField("Polish definition matching the provided sense."),
  Translation: stringField("Russian translation of the verb."),
  ExampleFormInf: stringField(
    "Polish sentence using the verb exactly in infinitive form.",
  ),
  ExampleFormInfSpaces: stringField(
    "ExampleFormInf with the lemma replaced by underscores (one underscore per character, split groups for phrases).",
  ),
  ExampleFormInfRU: stringField("Russian translation of ExampleFormInf."),
  FormJa: stringField("Present tense, singular, first person (ja)."),
  FormTy: stringField("Present tense, singular, second person (ty)."),
  FormOn: stringField("Present tense, singular, third person masculine (on)."),
  FormMy: stringField("Present tense, plural, first person (my)."),
  FormWy: stringField("Present tense, plural, second person (wy)."),
  FormOni: stringField(
    "Present tense, plural, third person masculine-personal (oni).",
  ),
  FormMJaPrzeszly: stringField(
    "Past tense, masculine, singular, first person (ja).",
  ),
  FormMTyPrzeszly: stringField(
    "Past tense, masculine, singular, second person (ty).",
  ),
  FormMOnPrzeszly: stringField(
    "Past tense, masculine, singular, third person (on).",
  ),
  FormMMyPrzeszly: stringField(
    "Past tense, masculine-personal, plural, first person (my).",
  ),
  FormMWyPrzeszly: stringField(
    "Past tense, masculine-personal, plural, second person (wy).",
  ),
  FormMOniPrzeszly: stringField(
    "Past tense, masculine-personal, plural, third person (oni).",
  ),
  FormZJaPrzeszly: stringField(
    "Past tense, feminine, singular, first person (ja).",
  ),
  FormZTyPrzeszly: stringField(
    "Past tense, feminine, singular, second person (ty).",
  ),
  FormZOnaPrzeszly: stringField(
    "Past tense, feminine, singular, third person (ona).",
  ),
  FormZMyPrzeszly: stringField(
    "Past tense, non-masculine-personal, plural, first person (my).",
  ),
  FormZWyPrzeszly: stringField(
    "Past tense, non-masculine-personal, plural, second person (wy).",
  ),
  FormZOnePrzeszly: stringField(
    "Past tense, non-masculine-personal, plural, third person (one).",
  ),
};

const EN_DEFAULT_FIELDS: FieldMap = {
  Word: stringField("Source English word or phrase."),
  IPA: stringField(
    "US IPA transcription for the word. It should start and end with slashes (/.../). For example: /ˈskedʒ.uːl/.",
  ),
  Definition: stringField("English definition matching the provided sense."),
  Translation: stringField("Russian translation of the word."),
  Example1: stringField("English sentence with the lemma exactly as supplied."),
  Example1Spaces: stringField(
    "Example1 with the lemma replaced by underscores (one underscore per character, split groups for phrases).",
  ),
  Example1RU: stringField("Russian translation of Example1."),
  Example2: stringField(
    "Another English sentence with the same constraints as Example1.",
  ),
  Example2Spaces: stringField(
    "Example2 with the lemma replaced by underscores (one underscore per character, split groups for phrases).",
  ),
  Example2RU: stringField("Russian translation of Example2."),
  Synonym: stringField(
    "English synonym(s) if available separated by commas; otherwise an empty string.",
  ),
  VerbForms: stringField(
    "If the word is a verb, its Base Form (V1), Past Simple (V2), and Past Participle (V3) forms; otherwise an empty string. Format: V1 - V2 - V3.",
  ),
};

export const CARD_SCHEMAS: Record<DraftNoteType, CardSchemaDefinition> = {
  "PL: Default": createSchemaDefinition(
    "pl_default_note",
    `You are a bilingual lexicographer (Polish → Russian) working on ONE specific sense provided in the user message.
    Use ONLY the given context (Source word, Language, Sense translation (Ru), Sense note, Part of speech). Mirror its meaning in every field. If any required value cannot be supported without guessing, output the safest allowed empty value (e.g., empty string or empty array).
    ${EXAMPLE_SENTENCE_GUIDANCE}
    TASK
    1) Create EXACTLY TWO natural Polish example sentences that unambiguously express THIS sense of the Source word.
    2) For EACH example, also provide:
      - A faithful Russian translation of the example sentence.
      - A masked variant where EVERY standalone occurrence of the exact Source word string is replaced with underscores.
        • Use one underscore per character in Source word.
        • If the Source word contains multiple words, mask each word separately and keep single spaces between them (e.g., "Masz rację" → "____ _____").
        • Preserve all punctuation and spacing outside the masked tokens.
    3) Additionally provide sense-appropriate Polish synonyms (if safely available).
    Output MUST be valid JSON ONLY, matching exactly requested schema. No prose, no markdown.`,
    PL_DEFAULT_FIELDS,
  ),
  "PL: Verbs": createSchemaDefinition(
    "pl_verb_note",
    `You are a bilingual lexicographer (Polish → Russian) generating verb paradigms for ONE specific sense.
    Use ONLY the given context (Source word, Language, Sense translation (Ru), Sense note, Part of speech). If Part of speech is not a verb or the lemma is not conjugable in Polish, follow the schema’s fallback rules (e.g., emit empty arrays/fields as allowed) and do NOT invent forms.
    ${EXAMPLE_SENTENCE_GUIDANCE}
    TASK
    1) Set "Aspekt" ("dokonany" | "niedokonany") and "ParaAspektowa" (infinitive pair or "").
    2) In ALL forms and examples, strictly use the SOURCE verb and its aspect. Never conjugate or use ParaAspektowa (for perfective verbs, FormJa..FormOni are simple future forms like "zrobię").
    3) Provide all required inflected forms and exactly one natural, informative example sentence for each form.
    Output MUST be valid JSON ONLY, matching exactly requested schema. No prose, no markdown.`,
    PL_VERB_FIELDS,
  ),
  "PL: Nouns": createSchemaDefinition(
    "pl_nouns_note",
    `You are a bilingual lexicographer (Polish → Russian) generating noun declensions for ONE specific sense.
    Use ONLY the given context (Source word, Language, Sense translation (Ru), Sense note, Part of speech). If the lemma is not a Polish noun or a required form is genuinely unavailable, return the safest possible string and do NOT invent unsupported grammar.
    ${EXAMPLE_SENTENCE_GUIDANCE}
    TASK
    1) Create EXACTLY TWO natural Polish example sentences for THIS sense. Use the noun in the grammatically correct case required by the sentence (do not force nominative).
    2) For EACH example, provide Russian translation and a masked variant (the inflected noun replaced by underscores, 1 per character).
    3) Fill all required singular (FormLp*) and plural (FormLm*) declension forms for this sense.
    Output MUST be valid JSON ONLY, matching exactly requested schema. No prose, no markdown.`,
    PL_NOUNS_FIELDS,
  ),
  "PL: Verbs Inf": createSchemaDefinition(
    "pl_verbs_inf_note",
    `You are a bilingual lexicographer (Polish → Russian) generating verb forms for ONE specific sense.
    Use ONLY the given context (Source word, Language, Sense translation (Ru), Sense note, Part of speech). If the lemma is not a Polish verb or a required form is genuinely unavailable, return the safest possible string and do NOT invent unsupported grammar.
    ${EXAMPLE_SENTENCE_GUIDANCE}
    TASK
    1) Provide one natural Polish example sentence that uses the verb exactly in infinitive form and remains informative enough that the missing infinitive would be reasonably guessable from context.
    2) For that infinitive example, also provide:
      - A faithful Russian translation.
      - A masked variant where the exact infinitive is replaced with underscores.
    3) Fill all required present-tense and past-tense verb forms exactly as requested by the schema.
      - Respect standard Polish conjugation, person, number, and gender distinctions.
      - Keep all forms aligned to the same verb and sense.
    4) Output MUST be valid JSON ONLY, matching exactly requested schema. No prose, no markdown.`,
    PL_VERBS_INF_FIELDS,
  ),
  "EN: Default": createSchemaDefinition(
    "en_default_note",
    `You are a bilingual lexicographer (English → Russian) working on ONE specific sense.
    Use ONLY the given context (Source word, Language, Sense translation (Ru), Sense note, Part of speech). Mirror its meaning in every field. If any required value cannot be supported without guessing, output the safest allowed empty value (e.g., empty string or empty array).
    TASK
    1) Create EXACTLY TWO natural English example sentences that unambiguously express THIS sense of the Source word/phrase.
    2) For EACH example, also provide:
      - A faithful Russian translation of the example sentence.
      - A masked variant where EVERY standalone occurrence of the exact Source word/phrase string is replaced with underscores.
        • Use one underscore per character in Source word.
        • If the Source word contains multiple words, mask each word separately and keep single spaces between them (e.g., "break up" → "_____ __").
        • Preserve all punctuation and spacing outside the masked tokens.
    3) Additionally provide sense-appropriate English synonyms (if safely available).
    Output MUST be valid JSON ONLY, matching exactly requested schema. No prose, no markdown.`,
    EN_DEFAULT_FIELDS,
  ),
};

export const getCardSchema = (noteType: DraftNoteType) => {
  return CARD_SCHEMAS[noteType];
};
