import { SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ValueSelect } from '@/components/ValueSelect';
import { controlSizeVariants } from '@/components/ui/control-size';
import type { LangPair } from '@/lib/llm';
import { cn } from '@/lib/utils';

type SearchFormProps = {
  term: string;
  language: LangPair;
  isSubmitting: boolean;
  onTermChange: (term: string) => void;
  onLanguageChange: (language: LangPair) => void;
  onSearch: () => Promise<void>;
};

export function SearchForm({
  term,
  language,
  isSubmitting,
  onTermChange,
  onLanguageChange,
  onSearch,
}: SearchFormProps) {
  return (
    <div className="mx-auto w-full max-w-[800px]">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onSearch();
        }}
        role="search"
        aria-busy={isSubmitting}
        className="flex min-w-0 items-center rounded-[22px] border border-line/60 bg-surface p-1.5 shadow-[0_4px_20px] shadow-ink/3 transition-[border-color,box-shadow] focus-within:border-highlight focus-within:ring-2 focus-within:ring-highlight/25 md:p-2"
      >
        <ValueSelect
          values={['EN', 'PL'] as const}
          value={language}
          onValueChange={onLanguageChange}
          disabled={isSubmitting}
          blurOnPointerSelect
          optionLabels={{ EN: 'English', PL: 'Polish' }}
          showOptionValue
          valueLabel={language}
          size="xl"
          mdSize="3xl"
          align="start"
          aria-label="Source language"
          className="w-15 shrink-0 justify-center gap-1 border-0 bg-surface-subtle px-2 text-base font-semibold text-ink shadow-none focus-visible:ring-highlight/30 md:w-24 md:text-lg"
        />
        <span aria-hidden="true" className="mx-1 h-7 w-px shrink-0 bg-line md:mx-3 md:h-11" />
        <Input
          name="term"
          value={term}
          onChange={(event) => onTermChange(event.target.value)}
          placeholder="Enter a word or phrase"
          aria-label="Word or phrase"
          aria-describedby="search-context-hint"
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          enterKeyHint="search"
          maxLength={50}
          className={cn(
            controlSizeVariants({ size: 'xl', mdSize: '3xl' }),
            'w-0 flex-1 rounded-none border-0 px-2 text-base text-ink shadow-none placeholder:text-text-muted selection:bg-highlight-light selection:text-ink focus-visible:border-transparent focus-visible:ring-0 md:px-4 md:text-xl',
          )}
        />
        <Button
          type="submit"
          size="xl"
          mdSize="3xl"
          className="w-15 shrink-0 border-0 bg-primary px-0 text-white shadow-[0_4px_12px] shadow-ink/8 hover:bg-primary/90 focus-visible:ring-highlight focus-visible:ring-offset-2 md:w-24"
          disabled={isSubmitting}
          aria-label="Search"
        >
          <SearchIcon aria-hidden="true" className="size-6 md:size-7" />
        </Button>
      </form>
      <p
        id="search-context-hint"
        className="mt-3 px-2 text-center text-sm leading-relaxed text-text-secondary md:mt-5 md:text-base"
      >
        Add context in [brackets] for a more precise answer.
      </p>
    </div>
  );
}
