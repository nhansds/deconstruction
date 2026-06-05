import { Link, NavLink, Outlet } from 'react-router-dom'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-indigo-600 text-white shadow'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
  }`

export function ShellLayout() {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="text-lg font-semibold tracking-tight text-indigo-600">
            deconstruction
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/" end className={linkClass}>
              Tableau public
            </NavLink>
            <NavLink to="/admin" className={linkClass}>
              Administration
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
