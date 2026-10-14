import { useRef, useState } from 'react';
import { disambiguate, type DisambiguateResult, type LangPair } from '@/lib/llm';
import { showRequestError } from '@/services/notifications';
import { useSessionStore } from '@/stores/session';

export function useTermSearch() {
  const language = useSessionStore((state) => state.language);
  const setLanguage = useSessionStore((state) => state.setLanguage);
  const [term, setTerm] = useState('');
  const [result, setResult] = useState<DisambiguateResult | null>(null);
  const [pendingTerm, setPendingTerm] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const changeLanguage = (nextLanguage: LangPair) => {
    if (nextLanguage === language) return;
    setLanguage(nextLanguage);
    setResult(null);
  };

  const search = async () => {
    const normalized = term.trim();
    if (!normalized || submittingRef.current) return;

    submittingRef.current = true;
    setPendingTerm(normalized);
    try {
      setResult(await disambiguate(normalized, language));
    } catch (error) {
      console.warn('Failed to disambiguate term', error);
      showRequestError(error, 'Failed to fetch translations. Please try again.');
    } finally {
      submittingRef.current = false;
      setPendingTerm(null);
    }
  };

  return {
    term,
    setTerm,
    language,
    changeLanguage,
    result,
    pendingTerm,
    isSubmitting: pendingTerm !== null,
    search,
  };
}
