import { SearchForm } from '@/components/search/SearchForm';
import { SearchStatus } from '@/components/search/SearchStatus';
import { useTermSearch } from '@/components/search/useTermSearch';
import { SensesResults } from '@/components/senses/SensesResults';
import { SensesSkeleton } from '@/components/senses/SensesSkeleton';
import { cn } from '@/lib/utils';

export function HomeScreen() {
  const { result, term, language, pendingTerm, isSubmitting, setTerm, changeLanguage, search } =
    useTermSearch();

  return (
    <section
      aria-label="Search words and phrases"
      className={cn(
        'mx-auto flex w-full flex-col',
        !result && 'min-h-[60vh] md:self-start md:justify-center',
      )}
    >
      {!result && (
        <div className="mb-6 text-left md:mb-10 md:text-center">
          <h1 className="text-[28px] leading-tight font-bold tracking-tight text-ink md:text-[44px]">
            What do you want <span className="whitespace-nowrap">to learn?</span>
          </h1>
          <p className="mt-2 text-base leading-6 text-text-secondary md:text-[22px]">
            Translate, understand, and remember{' '}
            <span className="whitespace-nowrap">— with context.</span>
          </p>
        </div>
      )}
      <SearchForm
        term={term}
        language={language}
        isSubmitting={isSubmitting}
        onTermChange={setTerm}
        onLanguageChange={changeLanguage}
        onSearch={search}
      />
      {pendingTerm !== null ? (
        <>
          <SearchStatus term={pendingTerm} />
          <SensesSkeleton />
        </>
      ) : result ? (
        <SensesResults term={result.term} senses={result.senses} language={result.langPair} />
      ) : null}
    </section>
  );
}
