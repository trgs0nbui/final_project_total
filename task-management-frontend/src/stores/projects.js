import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import apiClient from '@/services/apiClient'

/**
 * @typedef {Object} Project
 * @property {number} id
 * @property {string} name
 * @property {string} description
 * @property {string} created_at  // ISO 8601
 * @property {string} updated_at  // ISO 8601
 */

export const useProjectStore = defineStore(
  'projects',
  () => {
    // State
    const projects = ref([]) // Project[]
    const currentProject = ref(null) // Project | null
    const isLoading = ref(false)
    const error = ref(null)
    const pagination = ref({
      page: 1,
      pageSize: 20,
      total: 0,
    })

    // Getters

    /**
     * Returns a function that finds a project by id from the projects array.
     * Returns undefined if not found.
     * @type {import('vue').ComputedRef<(id: number) => Project | undefined>}
     */
    const projectById = computed(() => (id) => projects.value.find((p) => p.id === id))

    // Actions

    /**
     * Fetch all projects from the API.
     * GET /api/projects/
     * Updates projects state and pagination.total if API returns a count field.
     */
    async function fetchProjects() {
      isLoading.value = true
      error.value = null

      try {
        const response = await apiClient.get('/api/projects/')
        const data = response.data

        // Support both paginated (DRF default: { count, results }) and plain array responses
        if (Array.isArray(data)) {
          projects.value = data
        } else {
          projects.value = data.results ?? data
          if (data.count !== undefined) {
            pagination.value.total = data.count
          }
        }
      } catch (err) {
        error.value = err.message || 'Không thể tải danh sách dự án.'
      } finally {
        isLoading.value = false
      }
    }

    /**
     * Fetch a single project by id.
     * GET /api/projects/:id/
     * Updates currentProject state.
     * @param {number} id - Project id
     */
    async function fetchProjectById(id) {
      isLoading.value = true
      error.value = null

      try {
        const response = await apiClient.get(`/api/projects/${id}/`)
        currentProject.value = response.data
      } catch (err) {
        error.value = err.message || 'Không thể tải thông tin dự án.'
      } finally {
        isLoading.value = false
      }
    }

    /**
     * Create a new project.
     * POST /api/projects/
     * Adds the new project to the projects array.
     * @param {{ name: string, key: string, description?: string, project_type: string, category?: string }} data
     * @returns {Project | undefined} The created project, or undefined on failure
     */
    async function createProject(data) {
      isLoading.value = true
      error.value = null

      try {
        const response = await apiClient.post('/api/projects/', {
          name: data.name,
          key: data.key,
          description: data.description ?? '',
          project_type: data.project_type,
          category: data.category ?? 'other',
        })
        const newProject = response.data
        projects.value.push(newProject)
        return newProject
      } catch (err) {
        error.value = err.message || 'Không thể tạo dự án.'
      } finally {
        isLoading.value = false
      }
    }

    /**
     * Delete a project by id.
     * DELETE /api/projects/:id/
     * Removes the project from the projects array.
     * @param {number} id - Project id
     */
    async function deleteProject(id) {
      isLoading.value = true
      error.value = null

      try {
        await apiClient.delete(`/api/projects/${id}/`)
        projects.value = projects.value.filter((p) => p.id !== id)

        // Clear currentProject if it was the deleted one
        if (currentProject.value?.id === id) {
          currentProject.value = null
        }
      } catch (err) {
        error.value = err.message || 'Không thể xóa dự án.'
      } finally {
        isLoading.value = false
      }
    }

    /**
     * Fetch all members of a project.
     * GET /api/projects/:id/members/
     * @param {string} projectId
     * @returns {Array} memberships array
     */
    async function fetchMembers(projectId) {
      isLoading.value = true
      error.value = null
      try {
        const response = await apiClient.get(`/api/projects/${projectId}/members/`)
        const data = response.data
        return Array.isArray(data) ? data : (data.results ?? [])
      } catch (err) {
        error.value = err.message || 'Không thể tải danh sách thành viên.'
        return []
      } finally {
        isLoading.value = false
      }
    }

    /**
     * Add a member to a project (owner only).
     * POST /api/projects/:id/members/
     * @param {string} projectId
     * @param {string} userId
     * @returns {Object|null} membership object or null on failure
     */
    async function addMember(projectId, userId) {
      isLoading.value = true
      error.value = null
      try {
        const response = await apiClient.post(`/api/projects/${projectId}/members/`, {
          user_id: userId,
        })
        return response.data
      } catch (err) {
        error.value = err.message || 'Không thể thêm thành viên.'
        return null
      } finally {
        isLoading.value = false
      }
    }

    /**
     * Remove a member from a project (owner only).
     * DELETE /api/projects/:id/members/:userId/
     * @param {string} projectId
     * @param {string} userId
     * @returns {boolean} true on success
     */
    async function removeMember(projectId, userId) {
      isLoading.value = true
      error.value = null
      try {
        await apiClient.delete(`/api/projects/${projectId}/members/${userId}/`)
        return true
      } catch (err) {
        error.value = err.message || 'Không thể xóa thành viên.'
        return false
      } finally {
        isLoading.value = false
      }
    }

    /**
     * Search users to add to a project (owner only).
     * GET /api/projects/:id/members/search/?q=
     * @param {string} projectId
     * @param {string} query — min 2 chars
     * @returns {Array} user list
     */
    async function searchUsersToAdd(projectId, query) {
      try {
        const response = await apiClient.get(`/api/projects/${projectId}/members/search/`, {
          params: { q: query },
        })
        const data = response.data
        return Array.isArray(data) ? data : (data.results ?? [])
      } catch (err) {
        error.value = err.message || 'Không thể tìm kiếm người dùng.'
        return []
      }
    }

    /**
     * Fetch member stats for projects owned by the current user.
     * GET /api/projects/member-stats/
     * @returns {{ total_members: number, owned_projects: number } | null}
     */
    async function fetchMemberStats() {
      error.value = null
      try {
        const response = await apiClient.get('/api/projects/member-stats/')
        return response.data
      } catch (err) {
        error.value = err.message || 'Không thể tải thống kê thành viên.'
        return null
      }
    }

    return {
      // State
      projects,
      currentProject,
      isLoading,
      error,
      pagination,
      // Getters
      projectById,
      // Actions
      fetchProjects,
      fetchProjectById,
      createProject,
      deleteProject,
      fetchMembers,
      addMember,
      removeMember,
      searchUsersToAdd,
      fetchMemberStats,
    }
  },
  {
    persist: {
      storage: sessionStorage,
      paths: ['currentProject'],
    },
  },
)
