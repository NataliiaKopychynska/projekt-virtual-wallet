import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export interface AuthUser {
  id: string
  name: string
  email: string
  picture: string
  givenName: string
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (credential: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'vw_user'

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? (JSON.parse(stored) as AuthUser) : null
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState(false)

  const login = useCallback(async (credential: string) => {
    setIsLoading(true)
    try {
      const res = await fetch('http://localhost:3001/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Login failed')
      }

      const { user: userData } = await res.json() as { user: AuthUser }
      setUser(userData)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
