import { createContext } from 'react'

export type ThemeId = 'light' | 'pink' | 'dark'

export type ThemeContextValue = {
  theme: ThemeId
  setTheme: (t: ThemeId) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export const THEME_STORAGE_KEY = 'deconstruction-theme'

export function readStoredTheme(): ThemeId {
  if (typeof window === 'undefined') return 'pink'
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    if (raw === 'light' || raw === 'pink' || raw === 'dark') return raw
  } catch {
    /* ignore */
  }
  return 'pink'
}

export function applyThemeToDocument(theme: ThemeId) {
  const root = document.documentElement
  root.dataset.theme = theme
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme === 'dark' ? 'dark' : 'light'
}
