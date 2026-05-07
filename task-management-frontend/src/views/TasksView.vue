<script setup>
/**
 * TasksView — danh sách tất cả công việc được giao cho user hiện tại,
 * across tất cả projects. Hiển thị dưới dạng bảng có filter và xem chi tiết.
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Filter, ArrowRight, Clock } from '@element-plus/icons-vue'
import { useTaskStore } from '@/stores/tasks'
import TaskDetailDrawer from '@/components/task/TaskDetailDrawer.vue'

const router = useRouter()
const taskStore = useTaskStore()

// ── Filter state ──────────────────────────────────────────────────────────────
const searchQuery = ref('')
const filterStatus = ref('')
const filterPriority = ref('')
const showFilters = ref(false)
const viewingTask = ref(null)

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

const STATUS_CONFIG = {
  todo: { label: 'Chờ xử lý', bg: '#F1F5F9', color: '#737686' },
  in_progress: { label: 'Đang thực hiện', bg: '#DBEAFE', color: '#2563eb' },
  done: { label: 'Hoàn thành', bg: '#DCFCE7', color: '#16a34a' },
}

const PRIORITY_CONFIG = {
  high: { label: 'Cao', dot: '#EF4444', color: '#EF4444' },
  medium: { label: 'Trung bình', dot: '#F97316', color: '#F97316' },
  low: { label: 'Thấp', dot: '#94A3B8', color: '#64748b' },
}

// ── Computed ──────────────────────────────────────────────────────────────────
const tasks = computed(() => taskStore.myTasks)
const isLoading = computed(() => taskStore.isLoading)
const storeError = computed(() => taskStore.error)

const activeFilterCount = computed(() => {
  let n = 0
  if (searchQuery.value.trim()) n++
  if (filterStatus.value) n++
  if (filterPriority.value) n++
  return n
})

// ── Pagination ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 15
const currentPage = ref(1)

const totalPages = computed(() => Math.max(1, Math.ceil(tasks.value.length / PAGE_SIZE)))

const pagedTasks = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return tasks.value.slice(start, start + PAGE_SIZE)
})

watch(
  () => tasks.value.length,
  () => {
    currentPage.value = 1
  },
)

function goPage(p) {
  if (p >= 1 && p <= totalPages.value) currentPage.value = p
}

const pageNumbers = computed(() => {
  const total = totalPages.value
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  if (currentPage.value <= 3) return [1, 2, 3, null, total]
  if (currentPage.value >= total - 2) return [1, null, total - 2, total - 1, total]
  return [1, null, currentPage.value, null, total]
})

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
  applyFilters()
})

// ── Handlers ─────────────────────────────────────────────────────────────────
let debounceTimer = null

async function applyFilters() {
  const params = {}
  if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
  if (filterStatus.value) params.status = filterStatus.value
  if (filterPriority.value) params.priority = filterPriority.value
  await taskStore.fetchMyTasks(params)
}

watch(searchQuery, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(applyFilters, 300)
})

watch([filterStatus, filterPriority], () => {
  applyFilters()
})

function resetFilters() {
  searchQuery.value = ''
  filterStatus.value = ''
  filterPriority.value = ''
  applyFilters()
}

function openTask(task) {
  viewingTask.value = task
}

function closeTask() {
  viewingTask.value = null
}

function goToProject(task) {
  router.push(`/projects/${task.project}`)
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getStatus(s) {
  return STATUS_CONFIG[s] ?? { label: s, bg: '#f3f3fe', color: '#737686' }
}

function getPriority(p) {
  return PRIORITY_CONFIG[p] ?? { label: p, dot: '#c3c6d7', color: '#737686' }
}

function formatDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  const today = new Date()
  return {
    text: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    overdue: d < today,
  }
}

function assigneeInitials(task) {
  return (task.assignee?.username ?? '').slice(0, 2).toUpperCase() || '?'
}
</script>

<template>
  <div class="tasks-view">
    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <div class="tasks-view__header">
      <div>
        <h2 class="tasks-view__title">Công việc của tôi</h2>
        <p class="tasks-view__subtitle">Tất cả công việc được giao cho bạn trên mọi dự án.</p>
      </div>
    </div>

    <!-- ── Interaction bar ─────────────────────────────────────────────── -->
    <div class="tasks-view__bar">
      <div class="tasks-view__bar-left">
        <!-- Search -->
        <div class="tv-search">
          <el-icon class="tv-search__icon" :size="16"><Search /></el-icon>
          <input
            v-model="searchQuery"
            class="tv-search__input"
            type="text"
            placeholder="Tìm kiếm công việc..."
            aria-label="Tìm kiếm công việc"
          />
        </div>

        <!-- Filter toggle -->
        <button
          class="tv-btn tv-btn--outline"
          :class="{ 'tv-btn--active': showFilters || activeFilterCount > 0 }"
          @click="showFilters = !showFilters"
        >
          <el-icon :size="15"><Filter /></el-icon>
          <span>Lọc</span>
          <span v-if="activeFilterCount > 0" class="tv-badge">{{ activeFilterCount }}</span>
        </button>

        <!-- Filter dropdowns -->
        <transition name="tv-expand">
          <div v-if="showFilters" class="tv-filters">
            <select v-model="filterStatus" class="tv-select" aria-label="Lọc theo trạng thái">
              <option v-for="o in STATUS_OPTIONS" :key="o.value" :value="o.value">
                {{ o.label }}
              </option>
            </select>
            <select v-model="filterPriority" class="tv-select" aria-label="Lọc theo độ ưu tiên">
              <option v-for="o in PRIORITY_OPTIONS" :key="o.value" :value="o.value">
                {{ o.label }}
              </option>
            </select>
            <button v-if="activeFilterCount > 0" class="tv-btn tv-btn--reset" @click="resetFilters">
              Xóa bộ lọc
            </button>
          </div>
        </transition>
      </div>

      <div class="tasks-view__bar-right">
        <span class="tv-count">{{ tasks.length }} công việc</span>
      </div>
    </div>

    <!-- ── API error ────────────────────────────────────────────────────── -->
    <el-alert
      v-if="storeError && !isLoading"
      :title="storeError"
      type="error"
      show-icon
      :closable="false"
      class="tasks-view__error"
    />

    <!-- ── Table ────────────────────────────────────────────────────────── -->
    <div class="tv-card" v-loading="isLoading" element-loading-text="Đang tải...">
      <table class="tv-table">
        <thead>
          <tr class="tv-thead-row">
            <th class="tv-th">Tiêu đề</th>
            <th class="tv-th">Dự án</th>
            <th class="tv-th">Trạng thái</th>
            <th class="tv-th">Độ ưu tiên</th>
            <th class="tv-th">Hạn hoàn thành</th>
            <th class="tv-th tv-th--action"></th>
          </tr>
        </thead>

        <tbody>
          <!-- Empty state -->
          <tr v-if="pagedTasks.length === 0 && !isLoading">
            <td colspan="6" class="tv-empty">
              <div class="tv-empty-content">
                <p class="tv-empty-title">Không có công việc nào</p>
                <p class="tv-empty-sub">
                  {{
                    activeFilterCount > 0
                      ? 'Thử xóa bộ lọc để xem tất cả.'
                      : 'Bạn chưa được giao công việc nào.'
                  }}
                </p>
              </div>
            </td>
          </tr>

          <tr
            v-for="task in pagedTasks"
            :key="task.id"
            class="tv-row"
            :class="{ 'tv-row--done': task.status === 'done' }"
          >
            <!-- Title -->
            <td class="tv-td">
              <div class="tv-title-cell" @click="openTask(task)">
                <span class="tv-title" :class="{ 'tv-title--done': task.status === 'done' }">
                  {{ task.title }}
                </span>
                <span v-if="task.description" class="tv-subtitle">
                  {{ task.description.slice(0, 60) }}{{ task.description.length > 60 ? '…' : '' }}
                </span>
              </div>
            </td>

            <!-- Project -->
            <td class="tv-td">
              <button class="tv-project-link" @click="goToProject(task)">
                {{ task.project_name ?? task.project?.name ?? '—' }}
                <el-icon :size="11"><ArrowRight /></el-icon>
              </button>
            </td>

            <!-- Status -->
            <td class="tv-td">
              <span
                class="tv-status-badge"
                :style="{
                  backgroundColor: getStatus(task.status).bg,
                  color: getStatus(task.status).color,
                }"
              >
                {{ getStatus(task.status).label }}
              </span>
            </td>

            <!-- Priority -->
            <td class="tv-td">
              <span class="tv-priority" :style="{ color: getPriority(task.priority).color }">
                <span
                  class="tv-priority__dot"
                  :style="{ backgroundColor: getPriority(task.priority).dot }"
                ></span>
                {{ getPriority(task.priority).label }}
              </span>
            </td>

            <!-- Due date -->
            <td class="tv-td">
              <span
                v-if="task.due_date"
                class="tv-due"
                :class="{
                  'tv-due--overdue': formatDate(task.due_date)?.overdue && task.status !== 'done',
                }"
              >
                <el-icon :size="12"><Clock /></el-icon>
                {{ formatDate(task.due_date)?.text }}
              </span>
              <span v-else class="tv-due-empty">—</span>
            </td>

            <!-- Action -->
            <td class="tv-td tv-td--action">
              <button class="tv-view-btn" @click="openTask(task)">Xem</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="tv-pagination">
        <span class="tv-pagination__info">Trang {{ currentPage }} / {{ totalPages }}</span>
        <div class="tv-pagination__controls">
          <button
            class="tv-page-btn"
            :disabled="currentPage === 1"
            @click="goPage(currentPage - 1)"
          >
            ‹
          </button>
          <template v-for="p in pageNumbers" :key="p ?? `e-${Math.random()}`">
            <span v-if="p === null" class="tv-page-ellipsis">…</span>
            <button
              v-else
              class="tv-page-btn"
              :class="{ 'tv-page-btn--active': p === currentPage }"
              @click="goPage(p)"
            >
              {{ p }}
            </button>
          </template>
          <button
            class="tv-page-btn"
            :disabled="currentPage === totalPages"
            @click="goPage(currentPage + 1)"
          >
            ›
          </button>
        </div>
      </div>
    </div>

    <!-- ── Task detail drawer ─────────────────────────────────────────── -->
    <TaskDetailDrawer
      :task="viewingTask"
      :project-id="viewingTask ? String(viewingTask.project) : ''"
      :project-name="viewingTask?.project_name ?? ''"
      :is-owner="false"
      @close="closeTask"
      @edit-task="closeTask"
      @delete-task="closeTask"
    />
  </div>
</template>

<style scoped>
.tasks-view {
  --primary: #004ac6;
  --on-surface: #191b23;
  --on-surface-variant: #434655;
  --outline: #737686;
  --outline-variant: #c3c6d7;
  --surface-lowest: #ffffff;
  --surface-container-low: #f3f3fe;
  --surface-container: #ededf9;
  --border-subtle: #e2e8f0;
  --error: #ba1a1a;

  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 48px;
}

/* ── Header ──────────────────────────────────────────────────────────────────── */
.tasks-view__title {
  font-size: 24px;
  font-weight: 700;
  line-height: 32px;
  letter-spacing: -0.02em;
  color: var(--on-surface);
  margin: 0 0 4px;
}

.tasks-view__subtitle {
  font-size: 14px;
  color: var(--on-surface-variant);
  margin: 0;
}

/* ── Interaction bar ─────────────────────────────────────────────────────────── */
.tasks-view__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  background: var(--surface-lowest);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 12px 16px;
}

.tasks-view__bar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  flex: 1;
}

.tasks-view__bar-right {
  flex-shrink: 0;
}

.tv-search {
  position: relative;
  min-width: 200px;
  max-width: 320px;
  flex: 1;
}

.tv-search__icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--outline);
  pointer-events: none;
}

.tv-search__input {
  width: 100%;
  padding: 7px 12px 7px 34px;
  background: var(--surface-container-low);
  border: 1px solid transparent;
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  color: var(--on-surface);
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  box-sizing: border-box;
}

.tv-search__input::placeholder {
  color: var(--outline);
}
.tv-search__input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(0, 74, 198, 0.12);
  background: var(--surface-lowest);
}

.tv-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s;
  white-space: nowrap;
  border: none;
}

.tv-btn--outline {
  background: var(--surface-lowest);
  border: 1px solid var(--border-subtle);
  color: var(--on-surface-variant);
}

.tv-btn--outline:hover {
  background: var(--surface-container-low);
}
.tv-btn--active {
  border-color: var(--primary);
  color: var(--primary);
}

.tv-btn--reset {
  background: none;
  border: 1px solid var(--outline-variant);
  color: var(--outline);
  font-size: 12px;
}

.tv-btn--reset:hover {
  color: var(--error);
  border-color: var(--error);
}

.tv-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: var(--primary);
  color: #fff;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
}

.tv-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tv-select {
  padding: 7px 28px 7px 10px;
  background: var(--surface-lowest);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  color: var(--on-surface);
  cursor: pointer;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23737686' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
}

.tv-select:focus {
  border-color: var(--primary);
}

.tv-count {
  font-size: 13px;
  color: var(--outline);
  white-space: nowrap;
}

.tv-expand-enter-active,
.tv-expand-leave-active {
  transition:
    opacity 0.15s,
    transform 0.15s;
}
.tv-expand-enter-from,
.tv-expand-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── Error ───────────────────────────────────────────────────────────────────── */
.tasks-view__error {
  border-radius: 8px;
}

/* ── Table card ──────────────────────────────────────────────────────────────── */
.tv-card {
  background: var(--surface-lowest);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.tv-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.tv-thead-row {
  background: var(--surface-container-low);
  border-bottom: 1px solid var(--border-subtle);
}

.tv-th {
  padding: 14px 16px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--outline);
  white-space: nowrap;
}

.tv-th--action {
  width: 80px;
}

.tv-row {
  border-bottom: 1px solid var(--border-subtle);
  transition: background-color 0.12s;
}

.tv-row:last-child {
  border-bottom: none;
}
.tv-row:hover {
  background: rgba(0, 74, 198, 0.02);
}
.tv-row--done {
  opacity: 0.65;
}

.tv-td {
  padding: 14px 16px;
  vertical-align: middle;
}

.tv-td--action {
  text-align: right;
  padding-right: 16px;
}

/* Title cell */
.tv-title-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  cursor: pointer;
}

.tv-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--on-surface);
  line-height: 20px;
}

.tv-title--done {
  text-decoration: line-through;
  color: var(--outline);
}

.tv-subtitle {
  font-size: 12px;
  color: var(--outline);
}

/* Project link */
.tv-project-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  font-size: 13px;
  color: var(--primary);
  cursor: pointer;
  font-weight: 500;
}

.tv-project-link:hover {
  text-decoration: underline;
}

/* Status badge */
.tv-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

/* Priority */
.tv-priority {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
}

.tv-priority__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Due date */
.tv-due {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--on-surface-variant);
}

.tv-due--overdue {
  color: var(--error);
  font-weight: 700;
}

.tv-due-empty {
  font-size: 13px;
  color: var(--outline-variant);
}

/* View button */
.tv-view-btn {
  padding: 5px 12px;
  background: var(--surface-container-low);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  color: var(--on-surface-variant);
  cursor: pointer;
  transition: background-color 0.12s;
  white-space: nowrap;
}

.tv-view-btn:hover {
  background: var(--surface-container);
  color: var(--primary);
}

/* Empty */
.tv-empty {
  padding: 64px 24px;
  text-align: center;
}

.tv-empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.tv-empty-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--on-surface-variant);
  margin: 0;
}

.tv-empty-sub {
  font-size: 13px;
  color: var(--outline);
  margin: 0;
}

/* Pagination */
.tv-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-top: 1px solid var(--border-subtle);
  background: var(--surface-container-low);
}

.tv-pagination__info {
  font-size: 13px;
  color: var(--outline);
}

.tv-pagination__controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tv-page-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-lowest);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--on-surface-variant);
  cursor: pointer;
  transition: background-color 0.12s;
}

.tv-page-btn:hover:not(:disabled) {
  background: var(--surface-container-low);
}
.tv-page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.tv-page-btn--active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
  font-weight: 700;
}

.tv-page-ellipsis {
  padding: 0 4px;
  color: var(--outline);
  font-size: 13px;
}

/* Responsive */
@media (max-width: 768px) {
  .tasks-view__bar {
    flex-direction: column;
    align-items: flex-start;
  }
  .tv-th:nth-child(2),
  .tv-td:nth-child(2) {
    display: none;
  }
}
</style>
