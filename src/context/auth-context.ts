import { createContext } from 'react'
import type { User } from 'firebase/auth'

export type AuthState = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  logOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)
