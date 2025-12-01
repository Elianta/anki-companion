import { useState, type FormEvent } from 'react';
import { SearchIcon } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { disambiguate } from '@/lib/llm';
import { formatRateLimitMessage, isRateLimitError } from '@/services/api';
import { useSessionStore } from '@/stores/session';
import { toast } from 'sonner';

export function HomeScreen() {
  const [term, setTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const language = useSessionStore((state) => state.language);
  const setSessionTerm = useSessionStore((state) => state.setTerm);
  const setSenses = useSessionStore((state) => state.setSenses);
  const navigate = useNavigate({ from: '/' });

  const handleSearch = async () => {
    const normalized = term.trim();
    if (!normalized || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await disambiguate(normalized, language);
      setSessionTerm(response.term);
      setSenses(response.senses);
      await navigate({ to: '/senses' });
    } catch (error) {
      console.warn('Failed to disambiguate term', error);
      const message = isRateLimitError(error)
        ? formatRateLimitMessage(error.retryAfterSeconds)
        : 'Failed to fetch translations. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleSearch();
  };

  return (
    <section className="mx-auto grid min-h-[60vh] w-full max-w-3xl items-start md:items-center">
      <form
        onSubmit={handleSubmit}
        className="relative flex items-stretch overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm transition focus-within:shadow-md"
      >
        <Input
          data-test-id="term-input"
          name="term"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Enter a word or chunk (context in [brackets])"
          maxLength={50}
          className="h-16 flex-1 rounded-none border-0 px-6 pr-20 text-base shadow-none focus-visible:border-transparent focus-visible:ring-0 md:h-20 md:text-lg md:pr-26"
        />
        <Button
          type="submit"
          size="lg"
          variant="secondary"
          className="absolute right-0 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full border-0 bg-slate-900 px-0 text-base font-semibold text-white shadow-md transition focus-visible:ring-0 hover:bg-slate-800 focus-visible:bg-slate-800 md:h-20 md:w-20"
          disabled={isSubmitting}
          data-test-id="search-button"
        >
          <SearchIcon className="size-6 md:size-7" />
        </Button>
      </form>
    </section>
  );
}
