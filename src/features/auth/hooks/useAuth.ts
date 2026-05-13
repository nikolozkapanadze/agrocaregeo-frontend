import { useState, useEffect, createContext, useContext } from 'react'
import { auth, setToken, clearToken, type User } from '@/shared/lib/api'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
})

export function useAuth(): AuthContextType {
  return useContext(AuthContext)
}

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      auth
        .me()
        .then(setUser)
        .catch(() => clearToken())
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string): Promise<void> => {
    const res = await auth.login(email, password)
    setToken(res.access_token)
    const me = await auth.me()
    setUser(me)
  }

  const logout = (): void => {
    clearToken()
    setUser(null)
    window.location.href = '/login'
  }

  return { user, isAuthenticated: !!user, isLoading, login, logout }
}
