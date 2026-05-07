import { storeToRefs } from 'pinia'
import { useProjectStore } from '@/stores/projects'

/**
 * Composable that wraps ProjectStore logic for reuse across components.
 *
 * @returns {{
 *   projects: import('vue').Ref,
 *   currentProject: import('vue').Ref,
 *   isLoading: import('vue').Ref,
 *   error: import('vue').Ref,
 *   pagination: import('vue').Ref,
 *   projectById: import('vue').ComputedRef,
 *   fetchProjects: () => Promise<void>,
 *   fetchProjectById: (id: number) => Promise<void>,
 *   createProject: (data: Object) => Promise<Object|undefined>,
 *   deleteProject: (id: number) => Promise<void>,
 * }}
 */
export function useProjects() {
  const projectStore = useProjectStore()
  const { projects, currentProject, isLoading, error, pagination, projectById } =
    storeToRefs(projectStore)

  return {
    // Reactive state
    projects,
    currentProject,
    isLoading,
    error,
    pagination,
    // Getters (computed)
    projectById,
    // Actions
    fetchProjects: () => projectStore.fetchProjects(),
    fetchProjectById: (id) => projectStore.fetchProjectById(id),
    createProject: (data) => projectStore.createProject(data),
    deleteProject: (id) => projectStore.deleteProject(id),
  }
}
