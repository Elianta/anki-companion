import { Link, Outlet, useRouterState } from "@tanstack/react-router"
import { LanguageSelect } from "@/components/LanguageSelect"

const NAV_LINKS = [
  { to: "/", label: "Слово" },
  { to: "/senses", label: "Значения" },
  { to: "/draft", label: "Черновик" },
  { to: "/export", label: "Экспорт" },
]

export function AppShell() {
  const { location } = useRouterState({
    select: (state) => ({ location: state.location }),
  })
  const isHomeRoute = location.pathname === "/"

  return (
    <div className="flex min-h-svh flex-col bg-slate-950 text-slate-50">
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Anki Companion
            </p>
            <LanguageSelect
              className="w-full sm:w-auto"
              disabled={!isHomeRoute}
            />
          </div>
          <nav className="flex flex-wrap gap-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                activeProps={{
                  "data-active": true,
                }}
                className="rounded-full border border-white/10 px-4 py-1.5 text-sm font-medium text-slate-300 transition hover:text-white data-[active=true]:border-white data-[active=true]:bg-white/10 data-[active=true]:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto flex max-w-6xl flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
