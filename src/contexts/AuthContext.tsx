import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth'
import { auth, provider } from '../firebase'

export interface AuthUser {
  id: string
  username: string
  email: string
  avatarURL: string
  givenName: string
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  loginWithGoogle: () => Promise<void>
  loginWithEmail: (email: string, password: string) => Promise<void>
  registerWithEmail: (email: string, password: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001'

const mapUserFromBackend = (user: AuthUser): AuthUser => ({
  id: user.id,
  username: user.username,
  email: user.email,
  avatarURL: user.avatarURL,
  givenName: user.givenName,
})

const mapUserFromFirebase = (firebaseUser: FirebaseUser): AuthUser => {
  const username = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Uzytkownik'
  return {
    id: firebaseUser.uid,
    username,
    email: firebaseUser.email || '',
    avatarURL: firebaseUser.photoURL || '',
    givenName: username.split(' ')[0] || username,
  }
}

const syncWithBackend = async (idToken: string): Promise<AuthUser> => {
  const res = await fetch(`${API_URL}/api/auth/firebase`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}` },
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? 'Authentication failed')
  }

  const { user } = (await res.json()) as { user: AuthUser }
  return mapUserFromBackend(user)
}

const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    promise
      .then((result) => {
        clearTimeout(timer)
        resolve(result)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let unsubscribe = () => {}

    const initializeAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence)
      } catch (error) {
        console.error('Failed to set auth persistence:', error)
      }

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!mounted) return

        if (!firebaseUser) {
          setUser(null)
          setIsLoading(false)
          return
        }

        try {
          const idToken = await firebaseUser.getIdToken()
          const backendUser = await withTimeout(syncWithBackend(idToken), 4000)
          setUser(backendUser)
        } catch (error) {
          console.error('Failed to restore auth session from backend, using Firebase fallback:', error)
          setUser(mapUserFromFirebase(firebaseUser))
        } finally {
          setIsLoading(false)
        }
      })
    }

    void initializeAuth()

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await signInWithPopup(auth, provider)
      const firebaseUser = result.user
      let appUser: AuthUser

      try {
        const idToken = await firebaseUser.getIdToken()
        appUser = await withTimeout(syncWithBackend(idToken), 4000)
      } catch (error) {
        console.error('Backend sync failed for Google login, using Firebase fallback:', error)
        appUser = mapUserFromFirebase(firebaseUser)
      }

      setUser(appUser)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = result.user
      let appUser: AuthUser

      try {
        const idToken = await firebaseUser.getIdToken()
        appUser = await withTimeout(syncWithBackend(idToken), 4000)
      } catch (error) {
        console.error('Backend sync failed for email login, using Firebase fallback:', error)
        appUser = mapUserFromFirebase(firebaseUser)
      }

      setUser(appUser)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const registerWithEmail = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = result.user
      let appUser: AuthUser

      try {
        const idToken = await firebaseUser.getIdToken()
        appUser = await withTimeout(syncWithBackend(idToken), 4000)
      } catch (error) {
        console.error('Backend sync failed for registration, using Firebase fallback:', error)
        appUser = mapUserFromFirebase(firebaseUser)
      }

      setUser(appUser)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email)
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
