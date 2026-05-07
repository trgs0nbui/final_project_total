import { ref } from 'vue'
import { defineStore } from 'pinia'
import apiClient from '@/services/apiClient'

/**
 * @typedef {Object} Comment
 * @property {string} id
 * @property {string} task
 * @property {{ id: string, username: string, full_name: string, avatar_url: string }} author
 * @property {string} content
 * @property {string} created_at
 * @property {string} updated_at
 */

export const useCommentStore = defineStore('comments', () => {
  // State
  const comments = ref([]) // Comment[]
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const error = ref(null)

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * Fetch all comments for a task.
   * GET /api/projects/:projectId/tasks/:taskId/comments/
   * @param {string} projectId
   * @param {string} taskId
   */
  async function fetchComments(projectId, taskId) {
    isLoading.value = true
    error.value = null
    try {
      const response = await apiClient.get(`/api/projects/${projectId}/tasks/${taskId}/comments/`)
      const data = response.data
      comments.value = Array.isArray(data) ? data : (data.results ?? [])
    } catch (err) {
      error.value = err.message || 'Không thể tải bình luận.'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new comment on a task.
   * POST /api/projects/:projectId/tasks/:taskId/comments/
   * @param {string} projectId
   * @param {string} taskId
   * @param {string} content
   * @returns {Comment|null}
   */
  async function createComment(projectId, taskId, content) {
    isSubmitting.value = true
    error.value = null
    try {
      const response = await apiClient.post(
        `/api/projects/${projectId}/tasks/${taskId}/comments/`,
        { content },
      )
      const newComment = response.data
      comments.value.push(newComment)
      return newComment
    } catch (err) {
      error.value = err.message || 'Không thể gửi bình luận.'
      return null
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Update a comment's content (author only).
   * PATCH /api/projects/:projectId/tasks/:taskId/comments/:commentId/
   * @param {string} projectId
   * @param {string} taskId
   * @param {string} commentId
   * @param {string} content
   * @returns {Comment|null}
   */
  async function updateComment(projectId, taskId, commentId, content) {
    isSubmitting.value = true
    error.value = null
    try {
      const response = await apiClient.patch(
        `/api/projects/${projectId}/tasks/${taskId}/comments/${commentId}/`,
        { content },
      )
      const updated = response.data
      const idx = comments.value.findIndex((c) => c.id === commentId)
      if (idx !== -1) comments.value[idx] = updated
      return updated
    } catch (err) {
      error.value = err.message || 'Không thể cập nhật bình luận.'
      return null
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Delete a comment (author or project owner).
   * DELETE /api/projects/:projectId/tasks/:taskId/comments/:commentId/
   * @param {string} projectId
   * @param {string} taskId
   * @param {string} commentId
   * @returns {boolean}
   */
  async function deleteComment(projectId, taskId, commentId) {
    error.value = null
    try {
      await apiClient.delete(`/api/projects/${projectId}/tasks/${taskId}/comments/${commentId}/`)
      comments.value = comments.value.filter((c) => c.id !== commentId)
      return true
    } catch (err) {
      error.value = err.message || 'Không thể xóa bình luận.'
      return false
    }
  }

  /** Reset store khi đóng drawer */
  function clearComments() {
    comments.value = []
    error.value = null
  }

  return {
    comments,
    isLoading,
    isSubmitting,
    error,
    fetchComments,
    createComment,
    updateComment,
    deleteComment,
    clearComments,
  }
})
