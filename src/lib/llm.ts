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

export async function disambiguate(term: string, langPair: LangPair): Promise<DisambiguateResult> {
  return Promise.resolve({
    term,
    langPair,
    senses: [
      {
        id: `${term}-${langPair}-1`,
        gloss: `${term} (${langPair}) · primary reading`,
      },
      {
        id: `${term}-${langPair}-2`,
        gloss: `${term} (${langPair}) · alternate reading`,
      },
    ],
  });
}
