<script setup>
/**
 * KanbanBoard — bảng Kanban 3 cột với filter/search.
 *
 * Props:
 *   tasks       {Task[]}  — danh sách tất cả công việc (đã được lọc từ store)
 *   isLoading   {boolean} — hiển thị loading spinner khi true
 *   projectId   {string}  — UUID của project hiện tại (để fetch lại khi filter thay đổi)
 *
 * Emits:
 *   task-moved  (taskId, newStatus)
 *   edit-task   (task)
 *   delete-task (task)
 *   add-task    (status)
 */
import { ref, computed, watch } from 'vue'
import { Search, Filter } from '@element-plus/icons-vue'
import KanbanColumn from './KanbanColumn.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useTaskStore } from '@/stores/tasks'

const props = defineProps({
  tasks: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  projectId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['task-moved', 'edit-task', 'delete-task', 'add-task', 'view-task'])

const taskStore = useTaskStore()

// ── Filter state ──────────────────────────────────────────────────────────────

const searchQuery = ref('')
const filterStatus = ref('')
const filterPriority = ref('')

const STATUS_OPTIONS = [
  { label: 'Tất cả trạng thái', value: '' },
  { label: 'Chờ xử lý', value: 'todo' },
  { label: 'Đang thực hiện', value: 'in_progress' },
  { label: 'Hoàn thành', value: 'done' },
]

const PRIORITY_OPTIONS = [
  { label: 'Tất cả độ ưu tiên', value: '' },
  { label: 'Thấp', value: 'low' },
  { label: 'Trung bình', value: 'medium' },
  { label: 'Cao', value: 'high' },
]

// ── Debounced fetch when filters change ───────────────────────────────────────

let debounceTimer = null

/**
 * Build query params and re-fetch tasks from the backend.
 * The backend supports: ?search=&status=&priority=
 */
async function applyFilters() {
  if (!props.projectId) return

  const params = {}
  if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
  if (filterStatus.value) params.status = filterStatus.value
  if (filterPriority.value) params.priority = filterPriority.value

  await taskStore.fetchTasks(props.projectId, params)
}

// Debounce search input (300 ms), immediate for dropdowns
watch(searchQuery, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(applyFilters, 300)
})

watch([filterStatus, filterPriority], () => {
  applyFilters()
})

// ── Column definitions ────────────────────────────────────────────────────────

const COLUMNS = [
  { status: 'todo', title: 'Chờ xử lý' },
  { status: 'in_progress', title: 'Đang thực hiện' },
  { status: 'done', title: 'Hoàn thành' },
]

/**
 * Phân loại tasks vào từng cột theo status.
 * Khi filter đang hoạt động, backend đã lọc — chúng ta chỉ phân loại lại.
 */
const tasksByColumn = computed(() => {
  const map = { todo: [], in_progress: [], done: [] }
  for (const task of props.tasks) {
    if (map[task.status] !== undefined) {
      map[task.status].push(task)
    }
  }
  return map
})

// ── Drag & drop ───────────────────────────────────────────────────────────────

/**
 * Relay từ KanbanColumn — chỉ emit nếu status thực sự thay đổi.
 * @param {string} taskId  — UUID của task
 * @param {string} newStatus
 */
function handleTaskDropped(taskId, newStatus) {
  const task = props.tasks.find((t) => t.id === taskId)
  if (task && task.status !== newStatus) {
    emit('task-moved', taskId, newStatus)
  }
}

// ── Active filter count (for badge) ──────────────────────────────────────────

const activeFilterCount = computed(() => {
  let count = 0
  if (searchQuery.value.trim()) count++
  if (filterStatus.value) count++
  if (filterPriority.value) count++
  return count
})

const showFilters = ref(false)

/** Xóa tất cả bộ lọc và fetch lại toàn bộ tasks */
function resetFilters() {
  searchQuery.value = ''
  filterStatus.value = ''
  filterPriority.value = ''
  applyFilters()
}
</script>

<template>
  <div class="kanban-board" role="region" aria-label="Bảng Kanban">
    <!-- ── Filter bar ──────────────────────────────────────────────────── -->
    <div class="kanban-board__filters">
      <!-- Search -->
      <div class="kanban-search">
        <el-icon class="kanban-search__icon" :size="16"><Search /></el-icon>
        <input
          v-model="searchQuery"
          class="kanban-search__input"
          type="text"
          placeholder="Tìm kiếm công việc..."
          aria-label="Tìm kiếm công việc"
        />
      </div>

      <!-- Filter toggle button -->
      <button
        class="kanban-filter-toggle"
        :class="{ 'kanban-filter-toggle--active': showFilters || activeFilterCount > 0 }"
        @click="showFilters = !showFilters"
      >
        <el-icon :size="15"><Filter /></el-icon>
        <span>Lọc</span>
        <span v-if="activeFilterCount > 0" class="kanban-filter-toggle__badge">
          {{ activeFilterCount }}
        </span>
      </button>

      <!-- Inline filter dropdowns (shown when expanded) -->
      <transition name="filter-expand">
        <div v-if="showFilters" class="kanban-filter-dropdowns">
          <select
            v-model="filterStatus"
            class="kanban-filter-select"
            aria-label="Lọc theo trạng thái"
          >
            <option v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>

          <select
            v-model="filterPriority"
            class="kanban-filter-select"
            aria-label="Lọc theo độ ưu tiên"
          >
            <option v-for="opt in PRIORITY_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>

          <button v-if="activeFilterCount > 0" class="kanban-filter-reset" @click="resetFilters">
            Xóa bộ lọc
          </button>
        </div>
      </transition>
    </div>

    <!-- ── Loading ────────────────────────────────────────────────────── -->
    <div v-if="isLoading" class="kanban-board__loading" aria-live="polite">
      <LoadingSpinner size="large" />
    </div>

    <!-- ── Board columns ──────────────────────────────────────────────── -->
    <div v-else class="kanban-board__columns">
      <KanbanColumn
        v-for="col in COLUMNS"
        :key="col.status"
        :title="col.title"
        :status="col.status"
        :tasks="tasksByColumn[col.status]"
        @task-dropped="handleTaskDropped"
        @edit-task="(task) => emit('edit-task', task)"
        @delete-task="(task) => emit('delete-task', task)"
        @add-task="(status) => emit('add-task', status)"
        @view-task="(task) => emit('view-task', task)"
      />
    </div>
  </div>
</template>

<style scoped>
/* ── Design tokens ───────────────────────────────────────────────────────────── */
.kanban-board {
  --primary: #004ac6;
  --surface-lowest: #ffffff;
  --surface-container-low: #f3f3fe;
  --surface-container: #ededf9;
  --on-surface: #191b23;
  --on-surface-variant: #434655;
  --outline: #737686;
  --outline-variant: #c3c6d7;
  --border-subtle: #e2e8f0;
  --error: #ba1a1a;
}

/* ── Board shell ─────────────────────────────────────────────────────────────── */
.kanban-board {
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Filter bar ──────────────────────────────────────────────────────────────── */
.kanban-board__filters {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* Search input */
.kanban-search {
  position: relative;
  flex: 1;
  max-width: 320px;
  min-width: 180px;
}

.kanban-search__icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--outline);
  pointer-events: none;
}

.kanban-search__input {
  width: 100%;
  padding: 7px 12px 7px 34px;
  background: var(--surface-lowest);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 400;
  line-height: 18px;
  color: var(--on-surface);
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  box-sizing: border-box;
}

.kanban-search__input::placeholder {
  color: var(--outline);
}

.kanban-search__input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(0, 74, 198, 0.12);
}

/* Filter toggle button */
.kanban-filter-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: var(--surface-lowest);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--on-surface-variant);
  cursor: pointer;
  transition:
    background-color 0.15s,
    border-color 0.15s;
  position: relative;
  white-space: nowrap;
}

.kanban-filter-toggle:hover {
  background: var(--surface-container-low);
}

.kanban-filter-toggle--active {
  border-color: var(--primary);
  color: var(--primary);
}

.kanban-filter-toggle__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: var(--primary);
  color: #ffffff;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
}

/* Filter dropdowns row */
.kanban-filter-dropdowns {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.kanban-filter-select {
  padding: 7px 28px 7px 10px;
  background: var(--surface-lowest);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 400;
  color: var(--on-surface);
  cursor: pointer;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23737686' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  transition: border-color 0.15s;
}

.kanban-filter-select:focus {
  border-color: var(--primary);
}

.kanban-filter-reset {
  padding: 7px 12px;
  background: none;
  border: 1px solid var(--outline-variant);
  border-radius: 8px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  color: var(--outline);
  cursor: pointer;
  transition:
    background-color 0.15s,
    color 0.15s;
  white-space: nowrap;
}

.kanban-filter-reset:hover {
  background: var(--surface-container-low);
  color: var(--error);
  border-color: var(--error);
}

/* Filter expand transition */
.filter-expand-enter-active,
.filter-expand-leave-active {
  transition:
    opacity 0.15s,
    transform 0.15s;
}

.filter-expand-enter-from,
.filter-expand-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── Loading ─────────────────────────────────────────────────────────────────── */
.kanban-board__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

/* ── Columns grid ────────────────────────────────────────────────────────────── */
.kanban-board__columns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  align-items: flex-start;
  background: rgba(237, 237, 249, 0.35);
  border-radius: 12px;
  padding: 24px;
}

/* ── Responsive ──────────────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .kanban-board__columns {
    grid-template-columns: 1fr;
    padding: 16px;
  }

  .kanban-search {
    max-width: 100%;
  }
}
</style>
