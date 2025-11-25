import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { BookmarkIcon, HomeIcon, UploadCloudIcon } from 'lucide-react';

import { useSessionStore } from '@/stores/session';
import { useEffect, useState } from 'react';
import { fetchDrafts } from '@/services/draft-storage';

const NAV_LINKS = [
  { to: '/', label: 'Search', icon: HomeIcon },
  { to: '/draft', label: 'Drafts', icon: BookmarkIcon },
  { to: '/export', label: 'Export', icon: UploadCloudIcon },
];

export function AppShell() {
  const [readyDraftCount, setReadyDraftCount] = useState(0);
  const { location } = useRouterState({
    select: (state) => ({ location: state.location }),
  });
  const isHomeRoute = location.pathname === '/';
  const language = useSessionStore((state) => state.language);
  const setLanguage = useSessionStore((state) => state.setLanguage);

  const toggleLanguage = () => {
    setLanguage(language === 'EN' ? 'PL' : 'EN');
  };

  useEffect(() => {
    let active = true;
    const loadDraftCount = async () => {
      try {
        const drafts = await fetchDrafts();
        const ready = drafts.filter((draft) => draft.card && !draft.exported).length;
        if (active) {
          setReadyDraftCount(ready);
        }
      } catch (error) {
        console.warn('Failed to load drafts for badge', error);
      }
    };

    loadDraftCount();
    return () => {
      active = false;
    };
  }, [location.pathname]);

  return (
    <div className="grid grid-rows-[max-content_minmax(400px,1fr)] min-h-svh bg-background text-foreground">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Anki Companion</p>
          </div>
          <nav className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              disabled={!isHomeRoute}
              onClick={toggleLanguage}
              className="h-10 w-10 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Toggle language"
              data-test-id="language-toggle-desktop"
            >
              {language}
            </button>
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  activeProps={{
                    'data-active': true,
                  }}
                  className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-900/20 hover:text-slate-900 data-[active=true]:border-slate-900 data-[active=true]:bg-slate-900 data-[active=true]:text-white"
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="grid">
        <div className="mx-auto grid w-full max-w-6xl px-4 pb-28 pt-10 sm:px-6 lg:px-8 md:pb-10">
          <Outlet />
        </div>
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <button
            type="button"
            disabled={!isHomeRoute}
            onClick={toggleLanguage}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-900 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Toggle language"
            data-test-id="language-toggle-mobile"
          >
            {language}
          </button>
          <div className="flex flex-1 items-center justify-end gap-8">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const showBadge = link.to === '/draft' && readyDraftCount > 0;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  activeProps={{
                    'data-active': true,
                  }}
                  className="relative flex flex-col items-center gap-1 rounded-lg px-3 py-1 text-xs font-medium text-slate-500 transition hover:text-slate-900 data-[active=true]:text-slate-900"
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                  {showBadge ? (
                    <span className="absolute right-3 -top-0.5 h-4 min-w-4 rounded-full flex justify-center bg-rose-500 px-1 text-[10px] font-semibold leading-4 text-white">
                      {readyDraftCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
