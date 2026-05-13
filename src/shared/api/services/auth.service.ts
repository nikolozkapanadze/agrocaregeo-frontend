import { api } from '../client'
import type { User, TokenResponse } from '../types'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  full_name: string
  org_name: string
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    return api.post<TokenResponse>('/auth/login', credentials)
  },

  async register(data: RegisterData): Promise<TokenResponse> {
    return api.post<TokenResponse>('/auth/register', data)
  },

  async getCurrentUser(): Promise<User> {
    return api.get<User>('/auth/me')
  },

  async logout(): Promise<void> {
    // Optional: Call logout endpoint if backend has one
    // return api.post('/auth/logout')
  },
}

export default authService
