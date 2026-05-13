import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '../api/services/auth.service'
import { tokenManager } from '../api/client'
import type { User, TokenResponse } from '../api/types'

interface AuthState {
  // State
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName: string, orgName: string) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login action
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const response: TokenResponse = await authService.login({ email, password })
          tokenManager.setToken(response.access_token)
          set({ 
            isAuthenticated: true, 
            isLoading: false,
            error: null 
          })
          // Fetch user details after login
          await get().fetchUser()
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed'
          set({ 
            isAuthenticated: false, 
            isLoading: false, 
            error: message 
          })
          throw error
        }
      },

      // Register action
      register: async (email: string, password: string, fullName: string, orgName: string) => {
        set({ isLoading: true, error: null })
        try {
          const response: TokenResponse = await authService.register({ 
            email, 
            password, 
            full_name: fullName, 
            org_name: orgName 
          })
          tokenManager.setToken(response.access_token)
          set({ 
            isAuthenticated: true, 
            isLoading: false,
            error: null
          })
          await get().fetchUser()
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Registration failed'
          set({ 
            isAuthenticated: false, 
            isLoading: false, 
            error: message 
          })
          throw error
        }
      },

      // Logout action
      logout: () => {
        tokenManager.clearToken()
        set({ 
          user: null, 
          isAuthenticated: false, 
          error: null 
        })
      },

      // Fetch current user
      fetchUser: async () => {
        if (!tokenManager.getToken()) return

        set({ isLoading: true })
        try {
          const user = await authService.getCurrentUser()
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })
        } catch (error) {
          // Only clear token on real auth failures (401), not network errors or
          // server-side load spikes. Network errors should not log the user out.
          const isAuthFailure =
            error instanceof Error &&
            (error.message.includes('401') ||
              error.message.toLowerCase().includes('unauthorized') ||
              error.message.toLowerCase().includes('session expired'))
          if (isAuthFailure) {
            tokenManager.clearToken()
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to fetch user'
            })
          } else {
            // Network / server error — stay logged in, just stop the loading state
            set({ isLoading: false })
          }
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        isAuthenticated: state.isAuthenticated,
        user: state.user 
      }),
    }
  )
)

export default useAuthStore
