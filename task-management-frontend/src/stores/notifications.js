import { ref } from 'vue'
import { defineStore } from 'pinia'
import apiClient from '@/services/apiClient'

export const useNotificationStore = defineStore('notifications', () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const notifications = ref([])
  const unreadCount = ref(0)
  const isLoading = ref(false)
  const error = ref(null)
  const pagination = ref({ count: 0, next: null, previous: null })

  // ── Polling ────────────────────────────────────────────────────────────────
  let _pollTimer = null

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * Fetch danh sách thông báo.
   * GET /api/notifications/?unread=true|false
   * @param {{ unreadOnly?: boolean }} options
   */
  async function fetchNotifications({ unreadOnly = false } = {}) {
    isLoading.value = true
    error.value = null
    try {
      const params = {}
      if (unreadOnly) params.unread = 'true'
      const response = await apiClient.get('/api/notifications/', { params })
      const data = response.data
      notifications.value = Array.isArray(data) ? data : (data.results ?? [])
      pagination.value = {
        count: data.count ?? notifications.value.length,
        next: data.next ?? null,
        previous: data.previous ?? null,
      }
    } catch (err) {
      error.value = err.message || 'Không thể tải thông báo.'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Lấy số thông báo chưa đọc — dùng cho badge trên icon chuông.
   * GET /api/notifications/unread-count/
   */
  async function fetchUnreadCount() {
    try {
      const response = await apiClient.get('/api/notifications/unread-count/')
      unreadCount.value = response.data.count ?? 0
    } catch {
      // Không hiển thị lỗi — đây là background poll
    }
  }

  /**
   * Đánh dấu một thông báo là đã đọc.
   * PATCH /api/notifications/<id>/read/
   * @param {string} id - UUID của notification
   */
  async function markAsRead(id) {
    try {
      const response = await apiClient.patch(`/api/notifications/${id}/read/`)
      const updated = response.data
      const idx = notifications.value.findIndex((n) => n.id === id)
      if (idx !== -1) notifications.value[idx] = updated
      if (unreadCount.value > 0) unreadCount.value--
    } catch (err) {
      error.value = err.message || 'Không thể đánh dấu đã đọc.'
    }
  }

  /**
   * Đánh dấu tất cả thông báo là đã đọc.
   * POST /api/notifications/mark-all-read/
   */
  async function markAllAsRead() {
    try {
      await apiClient.post('/api/notifications/mark-all-read/')
      notifications.value = notifications.value.map((n) => ({ ...n, is_read: true }))
      unreadCount.value = 0
    } catch (err) {
      error.value = err.message || 'Không thể đánh dấu tất cả đã đọc.'
    }
  }

  /**
   * Bắt đầu polling unread count mỗi 60 giây.
   * Gọi khi user đăng nhập.
   */
  function startPolling() {
    stopPolling()
    fetchUnreadCount()
    _pollTimer = setInterval(fetchUnreadCount, 60_000)
  }

  /**
   * Dừng polling.
   * Gọi khi user đăng xuất hoặc component unmount.
   */
  function stopPolling() {
    if (_pollTimer) {
      clearInterval(_pollTimer)
      _pollTimer = null
    }
  }

  return {
    // State
    notifications,
    unreadCount,
    isLoading,
    error,
    pagination,
    // Actions
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    startPolling,
    stopPolling,
  }
})
