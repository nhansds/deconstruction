import { useTheme } from '../hooks/useTheme'
import type { ThemeId } from '../context/theme-context'

const options: { id: ThemeId; label: string }[] = [
  { id: 'light', label: 'Clair' },
  { id: 'pink', label: 'Rose' },
  { id: 'dark', label: 'Sombre' },
]

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <div
      className="flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 shadow-sm light:border-slate-200 light:bg-slate-100/80 pink:border-pink-200/70 pink:bg-pink-100/50 dark:border-slate-600 dark:bg-slate-800/80"
      role="group"
      aria-label="Thème de l’interface"
    >
      {options.map(({ id, label }) => {
        const active = theme === id
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            onClick={() => setTheme(id)}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              active
                ? 'bg-white text-indigo-700 shadow-sm pink:bg-white pink:text-pink-800 dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 pink:text-pink-900/80 pink:hover:bg-pink-200/40 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
