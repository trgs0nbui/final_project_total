import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'

/**
 * Composable that wraps AuthStore logic for reuse across components.
 *
 * @returns {{
 *   user: import('vue').Ref,
 *   isAuthenticated: import('vue').Ref,
 *   isLoading: import('vue').Ref,
 *   error: import('vue').Ref,
 *   login: (credentials: { username: string, password: string }) => Promise<void>,
 *   register: (userData: { username: string, email: string, password: string, confirmPassword: string }) => Promise<void>,
 *   logout: () => void,
 * }}
 */
export function useAuth() {
  const authStore = useAuthStore()
  const { user, isAuthenticated, isLoading, error } = storeToRefs(authStore)

  return {
    // Reactive state
    user,
    isAuthenticated,
    isLoading,
    error,
    // Actions
    login: (credentials) => authStore.login(credentials),
    register: (userData) => authStore.register(userData),
    logout: () => authStore.logout(),
  }
}
