import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { auth, provider } from '../firebase'
import { signInWithPopup } from 'firebase/auth'

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

const getInitialUser = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as AuthUser) : null
  } catch {
    return null
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(getInitialUser)
  const [isLoading, setIsLoading] = useState(false)

  const login = useCallback(async () => {
    setIsLoading(true)
    try {
      // Logowanie przez popup Google
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      const idToken = await user.getIdToken()

      // Wysyłka tokenu do backendu
      const res = await fetch('http://localhost:3001/api/auth/firebase', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}` },
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
