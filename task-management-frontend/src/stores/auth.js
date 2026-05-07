import { ref } from 'vue'
import { defineStore } from 'pinia'
import apiClient from '@/services/apiClient'
import router from '@/router/index.js'

export const useAuthStore = defineStore(
  'auth',
  () => {
    // State
    const user = ref(null) // { id, username, email }
    const accessToken = ref(null)
    const refreshToken = ref(null)
    const isAuthenticated = ref(false)
    const isLoading = ref(false)
    const error = ref(null)

    /**
     * Login with username and password.
     * POST /api/auth/login/ — saves accessToken, refreshToken, user to state.
     * @param {{ username: string, password: string }} credentials
     */
    async function login(credentials) {
      isLoading.value = true
      error.value = null

      try {
        const response = await apiClient.post('/api/auth/login/', {
          username: credentials.username,
          password: credentials.password,
        })

        const { access, refresh, user: userData } = response.data

        accessToken.value = access
        refreshToken.value = refresh
        isAuthenticated.value = true

        // Some backends return user info in the token response; others require a separate call.
        // If user data is included, store it directly; otherwise build a minimal object.
        if (userData) {
          user.value = {
            id: userData.id,
            username: userData.username,
            email: userData.email,
          }
        } else {
          // Decode username from credentials as a fallback until profile is fetched
          user.value = { id: null, username: credentials.username, email: null }
        }
      } catch (err) {
        error.value = err.message || 'Đăng nhập thất bại. Vui lòng thử lại.'
        isAuthenticated.value = false
      } finally {
        isLoading.value = false
      }
    }

    /**
     * Register a new account.
     * POST /api/auth/register/ — does NOT auto-login; user must verify email first.
     * @param {{ username: string, email: string, password: string, confirmPassword: string }} userData
     * @returns {{ success: boolean, email?: string }} result object
     */
    async function register(userData) {
      isLoading.value = true
      error.value = null

      try {
        await apiClient.post('/api/auth/register/', {
          username: userData.username,
          email: userData.email,
          password: userData.password,
          confirm_password: userData.confirmPassword,
        })

        // Registration successful — user must verify email before logging in
        return { success: true, email: userData.email }
      } catch (err) {
        error.value = err.message || 'Đăng ký thất bại. Vui lòng thử lại.'
        return { success: false }
      } finally {
        isLoading.value = false
      }
    }

    /**
     * Logout — clears all tokens and user from state, redirects to /login.
     */
    function logout() {
      user.value = null
      accessToken.value = null
      refreshToken.value = null
      isAuthenticated.value = false
      error.value = null

      router.push('/login')
    }

    /**
     * Refresh the access token using the stored refresh token.
     * POST /api/auth/token/refresh/
     */
    async function refreshAccessToken() {
      isLoading.value = true
      error.value = null

      try {
        const response = await apiClient.post('/api/auth/token/refresh/', {
          refresh: refreshToken.value,
        })

        accessToken.value = response.data.access
      } catch (err) {
        error.value = err.message || 'Không thể làm mới phiên đăng nhập.'
      } finally {
        isLoading.value = false
      }
    }

    /**
     * Fetch the current user's full profile from the API.
     * GET /api/users/me/
     * Updates the user state with full_name, avatar_url, is_email_verified, etc.
     */
    async function fetchProfile() {
      isLoading.value = true
      error.value = null
      try {
        const response = await apiClient.get('/api/users/me/')
        user.value = response.data
      } catch (err) {
        error.value = err.message || 'Không thể tải thông tin hồ sơ.'
      } finally {
        isLoading.value = false
      }
    }

    /**
     * Update the current user's profile.
     * PATCH /api/users/me/ — only full_name and avatar_url are accepted.
     * @param {{ full_name?: string, avatar_url?: string }} data
     * @returns {boolean} true on success
     */
    async function updateProfile(data) {
      isLoading.value = true
      error.value = null
      try {
        const response = await apiClient.patch('/api/users/me/', data)
        user.value = response.data
        return true
      } catch (err) {
        error.value = err.message || 'Không thể cập nhật hồ sơ.'
        return false
      } finally {
        isLoading.value = false
      }
    }

    /**
     * Upload avatar image file for the current user.
     * POST /api/users/me/avatar/ — multipart/form-data with field 'avatar'.
     * Updates user.avatar_url in state on success.
     * @param {File} file - Image file selected by the user
     * @returns {boolean} true on success
     */
    async function uploadAvatar(file) {
      isLoading.value = true
      error.value = null
      try {
        const formData = new FormData()
        formData.append('avatar', file)
        const response = await apiClient.post('/api/users/me/avatar/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        user.value = response.data
        return true
      } catch (err) {
        error.value = err.message || 'Không thể tải ảnh lên. Vui lòng thử lại.'
        return false
      } finally {
        isLoading.value = false
      }
    }

    return {
      // State
      user,
      accessToken,
      refreshToken,
      isAuthenticated,
      isLoading,
      error,
      // Actions
      login,
      register,
      logout,
      refreshAccessToken,
      fetchProfile,
      updateProfile,
      uploadAvatar,
    }
  },
  {
    persist: {
      storage: localStorage,
      paths: ['user', 'accessToken', 'refreshToken', 'isAuthenticated'],
    },
  },
)
