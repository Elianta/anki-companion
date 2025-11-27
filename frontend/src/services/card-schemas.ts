/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';

import type { DraftNoteType } from '@/lib/db';

type FieldDefinition = {
  type: 'string';
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
      type: 'object';
      properties: Record<string, any>;
      required: string[];
      additionalProperties: false;
    };
  };
  validator: z.ZodObject<Record<string, any>>;
};

const stringField = (description: string): FieldDefinition => ({
  type: 'string',
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
      type: 'object',
      properties: fields,
      required: Object.keys(fields),
      additionalProperties: false,
    },
  },
  validator: buildValidator(fields),
});

const PL_DEFAULT_FIELDS: FieldMap = {
  Word: stringField('Source Polish word or phrase.'),
  Definition: stringField('Polish definition that matches the provided sense.'),
  Translation: stringField('Russian translation of the word or phrase.'),
  Example1: stringField(
    'Polish sentence with the lemma exactly as supplied. If the lemma is a verb, keep its infinitive form.',
  ),
  Example1Spaces: stringField(
    'Example1 with the lemma replaced by underscores (one underscore per character, split groups for phrases).',
  ),
  Example1RU: stringField('Russian translation of Example1.'),
  Example2: stringField('Another Polish sentence with the same constraints as Example1.'),
  Example2Spaces: stringField(
    'Example2 with the lemma replaced by underscores (one underscore per character, split groups for phrases).',
  ),
  Example2RU: stringField('Russian translation of Example2.'),
  Synonym: stringField(
    'Polish synonym(s) if available separated by commas; otherwise an empty string.',
  ),
  Antonym: stringField(
    'Polish antonym(s) if available separated by commas; otherwise an empty string.',
  ),
};

const PL_VERB_FIELDS: FieldMap = {
  Verb: stringField('Original Polish verb or chunk.'),
  Definition: stringField('Polish definition matching the sense.'),
  Translation: stringField('Russian translation of the verb.'),
  FormJa: stringField('Present tense, singular, first person (ja).'),
  ExampleFormJa: stringField('Sentence using the verb in FormJa.'),
  FormTy: stringField('Present tense, singular, second person (ty).'),
  ExampleFormTy: stringField('Sentence using the verb in FormTy.'),
  FormOn: stringField('Present tense, singular, third person masculine (on).'),
  ExampleFormOn: stringField('Sentence using the verb in FormOn.'),
  FormMy: stringField('Present tense, plural, first person (my).'),
  ExampleFormMy: stringField('Sentence using the verb in FormMy.'),
  FormWy: stringField('Present tense, plural, second person (wy).'),
  ExampleFormWy: stringField('Sentence using the verb in FormWy.'),
  FormOni: stringField('Present tense, plural, third person masculine (oni).'),
  ExampleFormOni: stringField('Sentence using the verb in FormOni.'),
  FormMJaPrzeszly: stringField('Past tense, masculine, singular, first person (ja).'),
  ExampleFormMJaPrzeszly: stringField('Sentence using the verb in FormMJaPrzeszly.'),
  FormMTyPrzeszly: stringField('Past tense, masculine, singular, second person (ty).'),
  ExampleFormMTyPrzeszly: stringField('Sentence using the verb in FormMTyPrzeszly.'),
  FormMOnPrzeszly: stringField('Past tense, masculine, singular, third person (on).'),
  ExampleFormMOnPrzeszly: stringField('Sentence using the verb in FormMOnPrzeszly.'),
  FormMMyPrzeszly: stringField('Past tense, masculine, plural, first person (my).'),
  ExampleFormMMyPrzeszly: stringField('Sentence using the verb in FormMMyPrzeszly.'),
  FormMWyPrzeszly: stringField('Past tense, masculine, plural, second person (wy).'),
  ExampleFormMWyPrzeszly: stringField('Sentence using the verb in FormMWyPrzeszly.'),
  FormMOniPrzeszly: stringField('Past tense, masculine, plural, third person (oni).'),
  ExampleFormMOniPrzeszly: stringField('Sentence using the verb in FormMOniPrzeszly.'),
  FormZJaPrzeszly: stringField('Past tense, feminine, singular, first person (ja).'),
  ExampleFormZJaPrzeszly: stringField('Sentence using the verb in FormZJaPrzeszly.'),
  FormZTyPrzeszly: stringField('Past tense, feminine, singular, second person (ty).'),
  ExampleFormZTyPrzeszly: stringField('Sentence using the verb in FormZTyPrzeszly.'),
  FormZOnaPrzeszly: stringField('Past tense, feminine, singular, third person (ona).'),
  ExampleFormZOnaPrzeszly: stringField('Sentence using the verb in FormZOnaPrzeszly.'),
  FormZMyPrzeszly: stringField('Past tense, feminine, plural, first person (my).'),
  ExampleFormZMyPrzeszly: stringField('Sentence using the verb in FormZMyPrzeszly.'),
  FormZWyPrzeszly: stringField('Past tense, feminine, plural, second person (wy).'),
  ExampleFormZWyPrzeszly: stringField('Sentence using the verb in FormZWyPrzeszly.'),
  FormZOnePrzeszly: stringField('Past tense, feminine, plural, third person (one).'),
  ExampleFormZOnePrzeszly: stringField('Sentence using the verb in FormZOnePrzeszly.'),
};

const EN_DEFAULT_FIELDS: FieldMap = {
  Word: stringField('Source English word or phrase.'),
  IPA: stringField(
    'US IPA transcription for the word. It should start and end with slashes (/.../). For example: /ˈskedʒ.uːl/.',
  ),
  Definition: stringField('English definition matching the provided sense.'),
  Translation: stringField('Russian translation of the word.'),
  Example1: stringField('English sentence with the lemma exactly as supplied.'),
  Example1Spaces: stringField(
    'Example1 with the lemma replaced by underscores (one underscore per character, split groups for phrases).',
  ),
  Example1RU: stringField('Russian translation of Example1.'),
  Example2: stringField('Another English sentence with the same constraints as Example1.'),
  Example2Spaces: stringField(
    'Example2 with the lemma replaced by underscores (one underscore per character, split groups for phrases).',
  ),
  Example2RU: stringField('Russian translation of Example2.'),
  Synonym: stringField(
    'English synonym(s) if available separated by commas; otherwise an empty string.',
  ),
  Antonym: stringField(
    'English antonym(s) if available separated by commas; otherwise an empty string.',
  ),
};

export const CARD_SCHEMAS: Record<DraftNoteType, CardSchemaDefinition> = {
  'PL: Default': createSchemaDefinition(
    'pl_default_note',
    `You are a bilingual lexicographer (Polish → Russian) working on ONE specific sense provided in the user message.
    Use ONLY the given context (Source word, Language, Sense translation (Ru), Sense note, Part of speech). Mirror its meaning in every field. If any required value cannot be supported without guessing, output the safest allowed empty value (e.g., empty string or empty array).
    TASK
    1) Create EXACTLY TWO natural Polish example sentences that unambiguously express THIS sense of the Source word.
    2) For EACH example, also provide:
      - A faithful Russian translation of the example sentence.
      - A masked variant where EVERY standalone occurrence of the exact Source word string is replaced with underscores.
        • Use one underscore per character in Source word.
        • If the Source word contains multiple words, mask each word separately and keep single spaces between them (e.g., "Masz rację" → "____ _____").
        • Preserve all punctuation and spacing outside the masked tokens.
    3) Additionally provide sense-appropriate Polish synonyms and antonyms (if safely available).
    Output MUST be valid JSON ONLY, matching exactly requested schema. No prose, no markdown.`,
    PL_DEFAULT_FIELDS,
  ),
  'PL: Verb': createSchemaDefinition(
    'pl_verb_note',
    `You are a bilingual lexicographer (Polish → Russian) generating verb paradigms for ONE specific sense.
    Use ONLY the given context (Source word, Language, Sense translation (Ru), Sense note, Part of speech). If Part of speech is not a verb or the lemma is not conjugable in Polish, follow the schema’s fallback rules (e.g., emit empty arrays/fields as allowed) and do NOT invent forms.
    TASK
    1) Provide ALL required present-tense and past-tense forms for the Polish verb as specified by json_schema (fill every conjugation slot defined by the schema).
      - Respect standard Polish conjugation, orthography, and diacritics.
      - Keep forms aligned to THIS sense; do not introduce other meanings.
    2) For EACH inflected form, provide EXACTLY ONE natural Polish example sentence that correctly uses that specific form in context of THIS sense. Ensure the example is grammatical and idiomatic.
    3) If the schema includes metadata fields (e.g., aspect, person/number/gender labels), populate them precisely; otherwise keep to the exact structure defined by the schema.
    4) Prefer safety over speculation: where uncertain and the schema allows, output the safest empty value rather than hallucinate.
    Output MUST be valid JSON ONLY, matching exactly requested schema. No prose, no markdown.`,
    PL_VERB_FIELDS,
  ),
  'EN: Default': createSchemaDefinition(
    'en_default_note',
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
    3) Additionally provide sense-appropriate English synonyms and antonyms (if safely available).
    Output MUST be valid JSON ONLY, matching exactly requested schema. No prose, no markdown.`,
    EN_DEFAULT_FIELDS,
  ),
};

export const getCardSchema = (noteType: DraftNoteType) => {
  return CARD_SCHEMAS[noteType];
};
