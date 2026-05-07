import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import apiClient from '@/services/apiClient'

/**
 * @typedef {Object} Task
 * @property {number} id
 * @property {string} title
 * @property {string} description
 * @property {'todo' | 'in_progress' | 'done'} status
 * @property {'low' | 'medium' | 'high'} priority
 * @property {string | null} assignee
 * @property {number} project_id
 * @property {string} created_at  // ISO 8601
 * @property {string} updated_at  // ISO 8601
 */

export const useTaskStore = defineStore('tasks', () => {
  // State
  const tasks = ref([]) // Task[]
  const currentTask = ref(null) // Task | null
  const myTasks = ref([]) // Task[] — tasks assigned to current user
  const myTasksTotal = ref(0)
  const myTaskStats = ref(null) // { total_assigned, high_priority_todo, overdue, in_progress, done }
  const isLoading = ref(false)
  const error = ref(null)

  // Getters

  /**
   * Returns a function that filters tasks by status.
   * @type {import('vue').ComputedRef<(status: string) => Task[]>}
   */
  const tasksByStatus = computed(() => (status) => tasks.value.filter((t) => t.status === status))

  // Actions

  /**
   * Fetch tasks for a given project, with optional filter/search params.
   * GET /api/projects/:projectId/tasks/?search=&status=&priority=
   * @param {string} projectId - Project UUID
   * @param {Object} [params]  - Optional query params: { search, status, priority, assignee, due_date_from, due_date_to }
   */
  async function fetchTasks(projectId, params = {}) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.get(`/api/projects/${projectId}/tasks/`, { params })
      const data = response.data

      // Support both paginated (DRF default: { count, results }) and plain array responses
      if (Array.isArray(data)) {
        tasks.value = data
      } else {
        tasks.value = data.results ?? data
      }
    } catch (err) {
      error.value = err.message || 'Không thể tải danh sách công việc.'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new task in a project.
   * POST /api/projects/:projectId/tasks/
   * Adds the new task to the tasks array.
   * @param {number} projectId - Project id
   * @param {Object} data - Task data
   * @returns {Task | undefined} The created task, or undefined on failure
   */
  async function createTask(projectId, data) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.post(`/api/projects/${projectId}/tasks/`, data)
      const newTask = response.data
      tasks.value.push(newTask)
      return newTask
    } catch (err) {
      error.value = err.message || 'Không thể tạo công việc.'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update a task with full data (PUT).
   * PUT /api/projects/:projectId/tasks/:taskId/
   * Looks up projectId from the task already in the store.
   * @param {string} taskId - Task id
   * @param {Object} data - Full task data
   * @returns {Task | undefined} The updated task, or undefined on failure
   */
  async function updateTask(taskId, data) {
    isLoading.value = true
    error.value = null

    try {
      const projectId = _getProjectId(taskId)
      const response = await apiClient.put(`/api/projects/${projectId}/tasks/${taskId}/`, data)
      const updatedTask = response.data
      const index = tasks.value.findIndex((t) => t.id === taskId)
      if (index !== -1) {
        tasks.value[index] = updatedTask
      }
      return updatedTask
    } catch (err) {
      error.value = err.message || 'Không thể cập nhật công việc.'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Partially update a task (PATCH) — used for drag & drop status change.
   * PATCH /api/projects/:projectId/tasks/:taskId/
   * Uses optimistic update so the Kanban board doesn't flicker (no isLoading toggle).
   * @param {string} taskId - Task id
   * @param {Object} data - Partial task data
   * @returns {Task | undefined} The updated task, or undefined on failure
   */
  async function patchTask(taskId, data) {
    // Optimistic update: apply immediately so UI doesn't wait for the round-trip
    const index = tasks.value.findIndex((t) => t.id === taskId)
    const previousTask = index !== -1 ? { ...tasks.value[index] } : null
    if (index !== -1) {
      tasks.value[index] = { ...tasks.value[index], ...data }
    }

    error.value = null

    try {
      const projectId = _getProjectId(taskId)
      const response = await apiClient.patch(`/api/projects/${projectId}/tasks/${taskId}/`, data)
      const updatedTask = response.data
      // Replace with authoritative server response
      const idx = tasks.value.findIndex((t) => t.id === taskId)
      if (idx !== -1) {
        tasks.value[idx] = updatedTask
      }
      return updatedTask
    } catch (err) {
      // Rollback on failure
      if (previousTask !== null && index !== -1) {
        tasks.value[index] = previousTask
      }
      error.value = err.message || 'Không thể cập nhật công việc.'
    }
  }

  /**
   * Delete a task by id.
   * DELETE /api/projects/:projectId/tasks/:taskId/
   * @param {string} taskId - Task id
   */
  async function deleteTask(taskId) {
    isLoading.value = true
    error.value = null

    try {
      const projectId = _getProjectId(taskId)
      await apiClient.delete(`/api/projects/${projectId}/tasks/${taskId}/`)
      tasks.value = tasks.value.filter((t) => t.id !== taskId)

      // Clear currentTask if it was the deleted one
      if (currentTask.value?.id === taskId) {
        currentTask.value = null
      }
    } catch (err) {
      error.value = err.message || 'Không thể xóa công việc.'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch tasks assigned to the current user across all projects.
   * GET /api/tasks/
   * @param {Object} [params] - Optional query params: { status, priority, search }
   */
  async function fetchMyTasks(params = {}) {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.get('/api/tasks/', { params })
      const data = response.data

      if (Array.isArray(data)) {
        myTasks.value = data
      } else {
        myTasks.value = data.results ?? data
        if (data.count !== undefined) {
          myTasksTotal.value = data.count
        }
      }
    } catch (err) {
      error.value = err.message || 'Không thể tải danh sách công việc của bạn.'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch stats for tasks assigned to the current user.
   * GET /api/tasks/stats/
   * @returns {{ total_assigned, high_priority_todo, overdue, in_progress, done }}
   */
  async function fetchMyTaskStats() {
    error.value = null
    try {
      const response = await apiClient.get('/api/tasks/stats/')
      myTaskStats.value = response.data
      return response.data
    } catch (err) {
      error.value = err.message || 'Không thể tải thống kê công việc.'
      return null
    }
  }

  /**
   * Helper: get the projectId for a given taskId from the local tasks array.
   * The API response includes a `project` field (UUID) on every task object.
   * @param {string} taskId
   * @returns {string} projectId
   * @throws {Error} if task not found in store
   */
  function _getProjectId(taskId) {
    const task = tasks.value.find((t) => t.id === taskId)
    if (!task) {
      throw new Error(`Task ${taskId} không tìm thấy trong store.`)
    }
    // Backend serializer returns `project` as the UUID of the project
    return task.project
  }

  return {
    // State
    tasks,
    currentTask,
    myTasks,
    myTasksTotal,
    myTaskStats,
    isLoading,
    error,
    // Getters
    tasksByStatus,
    // Actions
    fetchTasks,
    createTask,
    updateTask,
    patchTask,
    deleteTask,
    fetchMyTasks,
    fetchMyTaskStats,
  }
})
