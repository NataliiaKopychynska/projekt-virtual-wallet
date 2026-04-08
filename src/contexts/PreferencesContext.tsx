import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  defaultPreferences,
  getResolvedTheme,
  type AppPreferences,
} from '../features/preferences/preferences'

interface PreferencesContextValue {
  preferences: AppPreferences
  resolvedTheme: 'dark' | 'light'
  updatePreferences: (updates: Partial<AppPreferences>) => void
  resetPreferences: () => void
}

const STORAGE_KEY = 'vw_preferences'
const PreferencesContext = createContext<PreferencesContextValue | null>(null)

const loadStoredPreferences = (): AppPreferences => {
  if (typeof window === 'undefined') {
    return defaultPreferences
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultPreferences

    const parsed = JSON.parse(raw) as Partial<AppPreferences>
    return { ...defaultPreferences, ...parsed }
  } catch (error) {
    console.error('Failed to read stored preferences:', error)
    return defaultPreferences
  }
}

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState<AppPreferences>(loadStoredPreferences)
  const [prefersDarkMode, setPrefersDarkMode] = useState(() => {
    if (typeof window === 'undefined') {
      return true
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    } catch (error) {
      console.error('Failed to persist preferences:', error)
    }
  }, [preferences])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => setPrefersDarkMode(event.matches)

    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const resolvedTheme = getResolvedTheme(preferences.theme, prefersDarkMode)

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
  }, [resolvedTheme])

  const updatePreferences = useCallback((updates: Partial<AppPreferences>) => {
    setPreferences((current) => ({ ...current, ...updates }))
  }, [])

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences)
  }, [])

  const value = useMemo(
    () => ({
      preferences,
      resolvedTheme,
      updatePreferences,
      resetPreferences,
    }),
    [preferences, resetPreferences, resolvedTheme, updatePreferences],
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const usePreferences = () => {
  const context = useContext(PreferencesContext)
  if (!context) {
    throw new Error('usePreferences must be used inside PreferencesProvider')
  }

  return context
}
