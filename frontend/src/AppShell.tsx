import { Link, Outlet } from '@tanstack/react-router';
import { BookmarkIcon, ClockIcon, HomeIcon, UploadCloudIcon } from 'lucide-react';

import { useEffect } from 'react';
import { useDraftCountStore } from '@/stores/drafts';
import { LLMSelect, LLMSelectDrawerButton } from '@/components/LLMSelect';
import pageBackground from '@/assets/bg.jpg';

const NAV_LINKS = [
  { to: '/', label: 'Search', icon: HomeIcon },
  { to: '/draft', label: 'Drafts', icon: BookmarkIcon },
  { to: '/export', label: 'Export', icon: UploadCloudIcon },
  { to: '/history', label: 'History', icon: ClockIcon },
];

export function AppShell() {
  const draftCount = useDraftCountStore((state) => state.count);
  const initCount = useDraftCountStore((state) => state.initCount);

  useEffect(() => {
    void initCount();
  }, [initCount]);

  return (
    <div className="relative isolate grid min-h-svh [--mobile-nav-height:calc(4.75rem+1px+env(safe-area-inset-bottom))] md:[--mobile-nav-height:0px] [--bottom-action-panel-height:4.5rem] md:[--bottom-action-panel-height:5.5rem] [--page-gutter:1.25rem] sm:[--page-gutter:1.5rem] lg:[--page-gutter:2rem] grid-cols-1 grid-rows-[max-content_minmax(400px,1fr)] bg-surface text-foreground">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="relative h-lvh w-screen bg-surface">
          <div
            className="absolute -inset-1 bg-cover bg-center bg-no-repeat blur-[1.5px]"
            style={{ backgroundImage: `url(${pageBackground})` }}
          />
          <div className="absolute inset-0 bg-white/75 md:bg-white/70" />
        </div>
      </div>
      <header className="border-b border-line/60 bg-white/20 pt-[env(safe-area-inset-top)] text-ink backdrop-blur-[10px]">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-(--page-gutter) md:h-[68px]">
          <p className="shrink-0 text-md font-medium uppercase tracking-[0.3em] text-ink">Ankify</p>
          <LLMSelectDrawerButton />
          <nav
            aria-label="Main navigation"
            className="hidden h-full items-center gap-5 md:flex lg:gap-7"
          >
            {NAV_LINKS.map((link) => {
              const showBadge = link.to === '/draft' && draftCount > 0;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  activeOptions={{ exact: link.to === '/' }}
                  activeProps={{
                    'data-active': true,
                  }}
                  className="relative flex h-full items-center gap-1.5 px-1 text-base font-semibold text-text-secondary transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-transparent hover:text-highlight-hover focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-highlight data-[active=true]:text-highlight data-[active=true]:hover:text-highlight-hover data-[active=true]:after:bg-highlight"
                >
                  {link.label}
                  {showBadge && (
                    <span
                      data-test-id="drafts-badge-desktop"
                      className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-semibold leading-5 text-white"
                    >
                      {draftCount}
                    </span>
                  )}
                </Link>
              );
            })}
            <LLMSelect />
          </nav>
        </div>
      </header>
      <main className="grid min-w-0 content-start [--bottom-action-panel-space:0px] has-[[data-slot=bottom-action-panel]]:[--bottom-action-panel-space:var(--bottom-action-panel-height)]">
        <div className="mx-auto w-full min-w-0 max-w-6xl px-(--page-gutter) pb-[calc(var(--mobile-nav-height)+var(--bottom-action-panel-space)+26px)] pt-8 md:pt-10">
          <Outlet />
        </div>
      </main>
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line/60 bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <div className="mx-auto grid h-19 max-w-3xl grid-cols-4 items-center justify-items-center gap-2 px-(--page-gutter) py-2">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const showBadge = link.to === '/draft' && draftCount > 0;
            return (
              <Link
                key={link.to}
                to={link.to}
                activeOptions={{ exact: link.to === '/' }}
                activeProps={{
                  'data-active': true,
                }}
                className="group flex min-h-14 w-full max-w-22 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-xs font-semibold text-text-secondary transition-colors first:justify-self-start last:justify-self-end hover:bg-surface-subtle hover:text-highlight-hover focus-visible:outline-2 focus-visible:outline-highlight data-[active=true]:bg-highlight-light data-[active=true]:text-highlight data-[active=true]:hover:text-highlight-hover"
              >
                <span className="relative">
                  <Icon className="size-6" aria-hidden="true" />
                  {showBadge && (
                    <span
                      data-test-id="drafts-badge-mobile"
                      className="absolute -right-2 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-semibold leading-5 text-white ring-2 ring-surface group-data-[active=true]:ring-highlight-light"
                    >
                      {draftCount}
                    </span>
                  )}
                </span>
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
