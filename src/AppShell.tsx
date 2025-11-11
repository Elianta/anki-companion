import { Link, Outlet } from "@tanstack/react-router";

const NAV_LINKS = [
  { to: "/", label: "Слово" },
  { to: "/senses", label: "Значения" },
  { to: "/draft", label: "Черновик" },
  { to: "/export", label: "Экспорт" },
];

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-title">Anki Companion</p>
          <p className="app-subtitle">EN→RU / PL→RU</p>
        </div>
        <nav className="app-nav">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="nav-link"
              activeProps={{
                className: "nav-link nav-link-active",
                "aria-current": "page",
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
