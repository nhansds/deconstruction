import { Link, NavLink, Outlet } from 'react-router-dom'
import { ThemeSwitcher } from './ThemeSwitcher'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `touch-manipulation rounded-lg px-3 py-2.5 text-center text-sm font-medium transition sm:py-2 ${
    isActive
      ? 'bg-indigo-600 text-white shadow pink:bg-pink-600 dark:bg-indigo-600'
      : 'text-slate-600 hover:bg-slate-100 light:text-slate-600 light:hover:bg-slate-100 pink:text-pink-950 pink:hover:bg-pink-100/70 dark:text-slate-300 dark:hover:bg-slate-800'
  }`

export function ShellLayout() {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 light:bg-slate-50 light:text-slate-900 pink:bg-gradient-to-br pink:from-pink-50 pink:via-rose-50 pink:to-fuchsia-50/90 pink:text-pink-950 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/80 pt-safe backdrop-blur light:border-slate-200 light:bg-white/80 pink:border-pink-200/50 pink:bg-white/75 pink:backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:px-4">
          <Link
            to="/"
            className="text-base font-semibold leading-snug tracking-tight text-indigo-600 break-words sm:text-lg sm:leading-tight pink:text-pink-700 dark:text-indigo-400"
          >
            Déconstruction — Qui sera le plus déconstruit ?
          </Link>
          <div className="flex min-w-0 flex-col gap-3 sm:flex-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
            <div className="w-full sm:w-auto sm:shrink-0">
              <ThemeSwitcher />
            </div>
            <nav className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end sm:gap-1">
              <NavLink to="/" end className={linkClass}>
                Tableau public
              </NavLink>
              <NavLink to="/admin" className={linkClass}>
                Administration
              </NavLink>
            </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-3 py-6 pb-safe sm:px-4 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}
