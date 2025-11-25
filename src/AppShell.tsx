import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { LanguageSelect } from '@/components/LanguageSelect';

const NAV_LINKS = [
  { to: '/', label: 'Слово' },
  { to: '/senses', label: 'Значения' },
  { to: '/draft', label: 'Черновик' },
  { to: '/export', label: 'Экспорт' },
];

export function AppShell() {
  const { location } = useRouterState({
    select: (state) => ({ location: state.location }),
  });
  const isHomeRoute = location.pathname === '/';

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Anki Companion</p>
            <LanguageSelect className="w-full sm:w-auto" disabled={!isHomeRoute} />
          </div>
          <nav className="flex flex-wrap gap-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                activeProps={{
                  'data-active': true,
                }}
                className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-900/20 hover:text-slate-900 data-[active=true]:border-slate-900 data-[active=true]:bg-slate-900 data-[active=true]:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto flex max-w-6xl flex-1 flex-col px-4 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
