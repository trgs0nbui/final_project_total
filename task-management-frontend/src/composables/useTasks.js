import { storeToRefs } from 'pinia'
import { useTaskStore } from '@/stores/tasks'

/**
 * Composable that wraps TaskStore logic for reuse across components.
 *
 * @returns {{
 *   tasks: import('vue').Ref,
 *   currentTask: import('vue').Ref,
 *   isLoading: import('vue').Ref,
 *   error: import('vue').Ref,
 *   tasksByStatus: import('vue').ComputedRef,
 *   fetchTasks: (projectId: number) => Promise<void>,
 *   createTask: (projectId: number, data: Object) => Promise<Object|undefined>,
 *   updateTask: (taskId: number, data: Object) => Promise<Object|undefined>,
 *   patchTask: (taskId: number, data: Object) => Promise<Object|undefined>,
 *   deleteTask: (taskId: number) => Promise<void>,
 * }}
 */
export function useTasks() {
  const taskStore = useTaskStore()
  const { tasks, currentTask, isLoading, error, tasksByStatus } = storeToRefs(taskStore)

  return {
    // Reactive state
    tasks,
    currentTask,
    isLoading,
    error,
    // Getters (computed)
    tasksByStatus,
    // Actions
    fetchTasks: (projectId) => taskStore.fetchTasks(projectId),
    createTask: (projectId, data) => taskStore.createTask(projectId, data),
    updateTask: (taskId, data) => taskStore.updateTask(taskId, data),
    patchTask: (taskId, data) => taskStore.patchTask(taskId, data),
    deleteTask: (taskId) => taskStore.deleteTask(taskId),
  }
}
