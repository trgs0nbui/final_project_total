<script setup>
/**
 * TaskTable — hiển thị danh sách công việc dưới dạng bảng.
 *
 * Props:
 *   tasks     {Task[]}  — danh sách tất cả công việc
 *   isLoading {boolean} — hiển thị trạng thái loading
 *   projectId {string}  — UUID project (để fetch lại khi filter thay đổi)
 *
 * Emits:
 *   edit-task   (task)
 *   delete-task (task)
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { Edit, Delete, Search, Filter, MoreFilled } from '@element-plus/icons-vue'
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

const emit = defineEmits(['edit-task', 'delete-task', 'view-task'])

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

// ── Backend filter fetch ──────────────────────────────────────────────────────

let debounceTimer = null

async function applyFilters() {
  if (!props.projectId) return
  const params = {}
  if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
  if (filterStatus.value) params.status = filterStatus.value
  if (filterPriority.value) params.priority = filterPriority.value
  await taskStore.fetchTasks(props.projectId, params)
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

const activeFilterCount = computed(() => {
  let n = 0
  if (searchQuery.value.trim()) n++
  if (filterStatus.value) n++
  if (filterPriority.value) n++
  return n
})

const showFilters = ref(false)

// ── Display helpers ───────────────────────────────────────────────────────────

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

function getStatus(s) {
  return STATUS_CONFIG[s] ?? { label: s, bg: '#f3f3fe', color: '#737686' }
}
function getPriority(p) {
  return PRIORITY_CONFIG[p] ?? { label: p, dot: '#c3c6d7', color: '#737686' }
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function assigneeInitials(task) {
  return (task.assignee?.username ?? '').slice(0, 2).toUpperCase() || '?'
}

// ── Row selection ─────────────────────────────────────────────────────────────

const selectedIds = ref(new Set())

const allSelected = computed(
  () => props.tasks.length > 0 && props.tasks.every((t) => selectedIds.value.has(t.id)),
)

function toggleAll() {
  if (allSelected.value) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(props.tasks.map((t) => t.id))
  }
}

function toggleRow(id) {
  const s = new Set(selectedIds.value)
  s.has(id) ? s.delete(id) : s.add(id)
  selectedIds.value = s
}

// ── Pagination ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10
const currentPage = ref(1)

const totalPages = computed(() => Math.max(1, Math.ceil(props.tasks.length / PAGE_SIZE)))

const pagedTasks = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return props.tasks.slice(start, start + PAGE_SIZE)
})

watch(
  () => props.tasks.length,
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

// ── Summary stats ─────────────────────────────────────────────────────────────

const stats = computed(() => {
  const total = props.tasks.length
  const done = props.tasks.filter((t) => t.status === 'done').length
  const high = props.tasks.filter((t) => t.priority === 'high' && t.status !== 'done').length
  const rate = total > 0 ? Math.round((done / total) * 100) : 0
  return { total, done, high, rate }
})

// ── Row action menu ───────────────────────────────────────────────────────────
//
// Menu được render qua <Teleport to="body"> với position: fixed để tránh bị
// clip bởi overflow: hidden của .tt-card, đặc biệt ở các hàng cuối bảng.

const activeMenuId = ref(null)
const menuStyle = ref({ top: '0px', left: '0px' })

/**
 * Mở/đóng menu và tính toán vị trí fixed dựa trên bounding rect của nút.
 * @param {string} id - task.id
 * @param {MouseEvent} event
 */
function toggleMenu(id, event) {
  if (activeMenuId.value === id) {
    activeMenuId.value = null
    return
  }

  const btn = event.currentTarget
  const rect = btn.getBoundingClientRect()
  const menuWidth = 148 // min-width của menu

  // Mặc định mở sang trái (right-aligned với nút)
  let left = rect.right - menuWidth
  // Nếu bị tràn ra ngoài viewport bên trái thì mở sang phải
  if (left < 8) left = rect.left

  menuStyle.value = {
    top: `${rect.bottom + 6}px`,
    left: `${left}px`,
  }
  activeMenuId.value = id
}

function handleEdit(task) {
  activeMenuId.value = null
  emit('edit-task', task)
}

function handleDelete(task) {
  activeMenuId.value = null
  emit('delete-task', task)
}

/** Đóng menu khi click ra ngoài hoặc scroll */
function closeMenu() {
  activeMenuId.value = null
}

onMounted(() => {
  document.addEventListener('click', closeMenu, true)
  window.addEventListener('scroll', closeMenu, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeMenu, true)
  window.removeEventListener('scroll', closeMenu, true)
})
</script>

<template>
  <div class="task-table">
    <!-- ── Interaction bar ──────────────────────────────────────────────── -->
    <div class="task-table__bar">
      <div class="task-table__bar-left">
        <!-- Search -->
        <div class="tt-search">
          <el-icon class="tt-search__icon" :size="16"><Search /></el-icon>
          <input
            v-model="searchQuery"
            class="tt-search__input"
            type="text"
            placeholder="Tìm kiếm công việc..."
            aria-label="Tìm kiếm công việc"
          />
        </div>

        <!-- Filter toggle -->
        <button
          class="tt-btn tt-btn--outline"
          :class="{ 'tt-btn--active': showFilters || activeFilterCount > 0 }"
          @click="showFilters = !showFilters"
        >
          <el-icon :size="15"><Filter /></el-icon>
          <span>Lọc</span>
          <span v-if="activeFilterCount > 0" class="tt-badge">{{ activeFilterCount }}</span>
        </button>

        <!-- Filter dropdowns -->
        <transition name="tt-expand">
          <div v-if="showFilters" class="tt-filters">
            <select v-model="filterStatus" class="tt-select" aria-label="Lọc theo trạng thái">
              <option v-for="o in STATUS_OPTIONS" :key="o.value" :value="o.value">
                {{ o.label }}
              </option>
            </select>
            <select v-model="filterPriority" class="tt-select" aria-label="Lọc theo độ ưu tiên">
              <option v-for="o in PRIORITY_OPTIONS" :key="o.value" :value="o.value">
                {{ o.label }}
              </option>
            </select>
            <button v-if="activeFilterCount > 0" class="tt-btn tt-btn--reset" @click="resetFilters">
              Xóa bộ lọc
            </button>
          </div>
        </transition>
      </div>

      <div class="task-table__bar-right">
        <span class="tt-count">{{ props.tasks.length }} công việc</span>
      </div>
    </div>

    <!-- ── Table card ────────────────────────────────────────────────────── -->
    <div class="tt-card" v-loading="isLoading" element-loading-text="Đang tải...">
      <table class="tt-table">
        <thead>
          <tr class="tt-thead-row">
            <th class="tt-th tt-th--check">
              <input
                type="checkbox"
                class="tt-checkbox"
                :checked="allSelected"
                :indeterminate="selectedIds.size > 0 && !allSelected"
                @change="toggleAll"
              />
            </th>
            <th class="tt-th">Tiêu đề</th>
            <th class="tt-th">Trạng thái</th>
            <th class="tt-th">Độ ưu tiên</th>
            <th class="tt-th">Người thực hiện</th>
            <th class="tt-th">Hạn hoàn thành</th>
            <th class="tt-th tt-th--action"></th>
          </tr>
        </thead>

        <tbody>
          <!-- Empty state -->
          <tr v-if="pagedTasks.length === 0 && !isLoading">
            <td colspan="7" class="tt-empty">Không có công việc nào</td>
          </tr>

          <tr
            v-for="task in pagedTasks"
            :key="task.id"
            class="tt-row"
            :class="{ 'tt-row--done': task.status === 'done' }"
          >
            <!-- Checkbox -->
            <td class="tt-td tt-td--check">
              <input
                type="checkbox"
                class="tt-checkbox"
                :checked="selectedIds.has(task.id)"
                @change="toggleRow(task.id)"
              />
            </td>

            <!-- Title -->
            <td class="tt-td">
              <div class="tt-title-cell" style="cursor: pointer" @click="emit('view-task', task)">
                <span class="tt-title" :class="{ 'tt-title--done': task.status === 'done' }">
                  {{ task.title }}
                </span>
                <span v-if="task.description" class="tt-subtitle">
                  {{ task.description.slice(0, 60) }}{{ task.description.length > 60 ? '…' : '' }}
                </span>
              </div>
            </td>

            <!-- Status -->
            <td class="tt-td">
              <span
                class="tt-status-badge"
                :style="{
                  backgroundColor: getStatus(task.status).bg,
                  color: getStatus(task.status).color,
                }"
              >
                {{ getStatus(task.status).label }}
              </span>
            </td>

            <!-- Priority -->
            <td class="tt-td">
              <span class="tt-priority" :style="{ color: getPriority(task.priority).color }">
                <span
                  class="tt-priority__dot"
                  :style="{ backgroundColor: getPriority(task.priority).dot }"
                ></span>
                {{ getPriority(task.priority).label }}
              </span>
            </td>

            <!-- Assignee -->
            <td class="tt-td">
              <div v-if="task.assignee" class="tt-assignee">
                <div class="tt-assignee__avatar">{{ assigneeInitials(task) }}</div>
                <span class="tt-assignee__name">{{ task.assignee.username }}</span>
              </div>
              <span v-else class="tt-unassigned">Chưa giao</span>
            </td>

            <!-- Due date -->
            <td class="tt-td">
              <span
                class="tt-due"
                :class="{
                  'tt-due--overdue':
                    task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date(),
                }"
              >
                {{ formatDate(task.due_date) }}
              </span>
            </td>

            <!-- Actions -->
            <td class="tt-td tt-td--action">
              <div class="tt-action-wrap">
                <button
                  class="tt-more-btn"
                  :aria-label="`Tùy chọn ${task.title}`"
                  @click.stop="toggleMenu(task.id, $event)"
                >
                  <el-icon :size="18"><MoreFilled /></el-icon>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="tt-pagination">
        <span class="tt-pagination__info">Trang {{ currentPage }} / {{ totalPages }}</span>
        <div class="tt-pagination__controls">
          <button
            class="tt-page-btn"
            :disabled="currentPage === 1"
            @click="goPage(currentPage - 1)"
          >
            ‹
          </button>
          <template v-for="p in pageNumbers" :key="p ?? `ellipsis-${Math.random()}`">
            <span v-if="p === null" class="tt-page-ellipsis">…</span>
            <button
              v-else
              class="tt-page-btn"
              :class="{ 'tt-page-btn--active': p === currentPage }"
              @click="goPage(p)"
            >
              {{ p }}
            </button>
          </template>
          <button
            class="tt-page-btn"
            :disabled="currentPage === totalPages"
            @click="goPage(currentPage + 1)"
          >
            ›
          </button>
        </div>
      </div>
    </div>

    <!-- ── Summary bento grid ────────────────────────────────────────────── -->
    <div class="tt-summary">
      <!-- Completion rate -->
      <div class="tt-bento tt-bento--primary">
        <div class="tt-bento__header">
          <span class="tt-bento__label">Tỷ lệ hoàn thành</span>
        </div>
        <div class="tt-bento__value">{{ stats.rate }}%</div>
        <div class="tt-progress">
          <div class="tt-progress__bar" :style="{ width: stats.rate + '%' }"></div>
        </div>
        <p class="tt-bento__sub">{{ stats.done }} / {{ stats.total }} công việc</p>
      </div>

      <!-- High priority blockers -->
      <div class="tt-bento tt-bento--danger">
        <div class="tt-bento__header">
          <span class="tt-bento__label">Ưu tiên cao chưa xong</span>
        </div>
        <div class="tt-bento__value">{{ stats.high }}</div>
        <div class="tt-blocker-dots">
          <span v-for="i in Math.min(stats.high, 5)" :key="i" class="tt-blocker-dot"></span>
          <span
            v-for="i in Math.max(0, 5 - stats.high)"
            :key="`e-${i}`"
            class="tt-blocker-dot tt-blocker-dot--empty"
          ></span>
        </div>
        <p class="tt-bento__sub">{{ stats.high > 0 ? 'Cần xử lý ngay' : 'Không có blocker' }}</p>
      </div>

      <!-- Workload -->
      <div class="tt-bento tt-bento--secondary">
        <div class="tt-bento__header">
          <span class="tt-bento__label">Tổng công việc</span>
        </div>
        <div class="tt-bento__value">{{ stats.total }}</div>
        <div class="tt-workload-bar">
          <span class="tt-workload-bar__fill"></span>
        </div>
        <p class="tt-bento__sub">Phân bổ đều trong nhóm</p>
      </div>
    </div>
  </div>

  <!-- ── Action menu portal — rendered at body level to escape overflow:hidden ── -->
  <Teleport to="body">
    <div v-if="activeMenuId !== null" class="tt-menu-portal" :style="menuStyle" @click.stop>
      <button
        class="tt-menu__item"
        @click="
          emit(
            'view-task',
            pagedTasks.find((t) => t.id === activeMenuId),
          )
        "
      >
        <el-icon :size="14"><Search /></el-icon>
        Xem chi tiết
      </button>
      <button
        class="tt-menu__item"
        @click="handleEdit(pagedTasks.find((t) => t.id === activeMenuId))"
      >
        <el-icon :size="14"><Edit /></el-icon>
        Chỉnh sửa
      </button>
      <button
        class="tt-menu__item tt-menu__item--danger"
        @click="handleDelete(pagedTasks.find((t) => t.id === activeMenuId))"
      >
        <el-icon :size="14"><Delete /></el-icon>
        Xóa
      </button>
    </div>
  </Teleport>
</template>

<style scoped>
/* ── Design tokens ───────────────────────────────────────────────────────────── */
.task-table {
  --primary: #004ac6;
  --primary-container: #2563eb;
  --surface: #faf8ff;
  --surface-lowest: #ffffff;
  --surface-container-low: #f3f3fe;
  --surface-container: #ededf9;
  --surface-container-high: #e7e7f3;
  --on-surface: #191b23;
  --on-surface-variant: #434655;
  --outline: #737686;
  --outline-variant: #c3c6d7;
  --border-subtle: #e2e8f0;
  --error: #ba1a1a;
  --priority-high: #ef4444;
}

/* ── Page shell ──────────────────────────────────────────────────────────────── */
.task-table {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Interaction bar ─────────────────────────────────────────────────────────── */
.task-table__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  background: var(--surface-lowest);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.task-table__bar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  flex: 1;
}

.task-table__bar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

/* Search */
.tt-search {
  position: relative;
  min-width: 200px;
  max-width: 300px;
  flex: 1;
}

.tt-search__icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--outline);
  pointer-events: none;
}

.tt-search__input {
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

.tt-search__input::placeholder {
  color: var(--outline);
}

.tt-search__input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(0, 74, 198, 0.12);
  background: var(--surface-lowest);
}

/* Buttons */
.tt-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 0.15s,
    border-color 0.15s;
  white-space: nowrap;
  border: none;
}

.tt-btn--outline {
  background: var(--surface-lowest);
  border: 1px solid var(--border-subtle);
  color: var(--on-surface-variant);
}

.tt-btn--outline:hover {
  background: var(--surface-container-low);
}

.tt-btn--active {
  border-color: var(--primary);
  color: var(--primary);
}

.tt-btn--reset {
  background: none;
  border: 1px solid var(--outline-variant);
  color: var(--outline);
  font-size: 12px;
}

.tt-btn--reset:hover {
  background: var(--surface-container-low);
  color: var(--error);
  border-color: var(--error);
}

.tt-badge {
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

/* Filter dropdowns */
.tt-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tt-select {
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

.tt-select:focus {
  border-color: var(--primary);
}

.tt-count {
  font-size: 13px;
  color: var(--outline);
  white-space: nowrap;
}

/* Expand transition */
.tt-expand-enter-active,
.tt-expand-leave-active {
  transition:
    opacity 0.15s,
    transform 0.15s;
}
.tt-expand-enter-from,
.tt-expand-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── Table card ──────────────────────────────────────────────────────────────── */
.tt-card {
  background: var(--surface-lowest);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  /* overflow: hidden removed — menu portal uses Teleport to escape clipping */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.tt-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

/* Header */
.tt-thead-row {
  background: var(--surface-container-low);
  border-bottom: 1px solid var(--border-subtle);
}

.tt-th {
  padding: 14px 16px;
  font-size: 11px;
  font-weight: 700;
  line-height: 16px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--outline);
  white-space: nowrap;
}

.tt-th--check {
  width: 48px;
  padding-left: 20px;
}
.tt-th--action {
  width: 56px;
}

/* Rows */
.tt-row {
  border-bottom: 1px solid var(--border-subtle);
  transition: background-color 0.12s;
}

.tt-row:last-child {
  border-bottom: none;
}
.tt-row:hover {
  background: rgba(0, 74, 198, 0.02);
}
.tt-row--done {
  opacity: 0.65;
}

.tt-td {
  padding: 14px 16px;
  vertical-align: middle;
}

.tt-td--check {
  padding-left: 20px;
  width: 48px;
}
.tt-td--action {
  width: 56px;
  text-align: right;
  padding-right: 16px;
}

/* Checkbox */
.tt-checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--primary);
  cursor: pointer;
}

/* Title cell */
.tt-title-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tt-title {
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: var(--on-surface);
}

.tt-title--done {
  text-decoration: line-through;
  color: var(--outline);
}

.tt-subtitle {
  font-size: 12px;
  color: var(--outline);
  line-height: 16px;
}

/* Status badge */
.tt-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

/* Priority */
.tt-priority {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
}

.tt-priority__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Assignee */
.tt-assignee {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tt-assignee__avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
  flex-shrink: 0;
}

.tt-assignee__name {
  font-size: 13px;
  color: var(--on-surface);
}

.tt-unassigned {
  font-size: 13px;
  color: var(--outline-variant);
  font-style: italic;
}

/* Due date */
.tt-due {
  font-size: 13px;
  color: var(--on-surface);
}

.tt-due--overdue {
  color: var(--error);
  font-weight: 700;
}

/* Empty */
.tt-empty {
  padding: 48px;
  text-align: center;
  font-size: 14px;
  color: var(--outline);
}

/* Action menu — wrapper (button only, no relative positioning needed) */
.tt-action-wrap {
  display: flex;
  justify-content: flex-end;
}

.tt-more-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: var(--outline);
  opacity: 0;
  transition:
    opacity 0.15s,
    background-color 0.15s;
}

.tt-row:hover .tt-more-btn {
  opacity: 1;
}
.tt-more-btn:hover {
  background: var(--surface-container-low);
  color: var(--on-surface);
}

.tt-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  background: var(--surface-lowest);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  z-index: 20;
  min-width: 140px;
  overflow: hidden;
}

.tt-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  background: none;
  border: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--on-surface);
  cursor: pointer;
  text-align: left;
  transition: background-color 0.12s;
}

.tt-menu__item:hover {
  background: var(--surface-container-low);
}

.tt-menu__item--danger {
  color: var(--error);
}
.tt-menu__item--danger:hover {
  background: #fff0f0;
}

/* ── Pagination ───────────────────────────────────────────────────────────────── */
.tt-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-top: 1px solid var(--border-subtle);
  background: var(--surface-container-low);
}

.tt-pagination__info {
  font-size: 13px;
  color: var(--outline);
}

.tt-pagination__controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tt-page-btn {
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
  transition:
    background-color 0.12s,
    color 0.12s;
}

.tt-page-btn:hover:not(:disabled) {
  background: var(--surface-container-low);
}
.tt-page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tt-page-btn--active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
  font-weight: 700;
}

.tt-page-ellipsis {
  padding: 0 4px;
  color: var(--outline);
  font-size: 13px;
}

/* ── Summary bento ───────────────────────────────────────────────────────────── */
.tt-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.tt-bento {
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tt-bento--primary {
  background: rgba(0, 74, 198, 0.05);
  border: 1px solid rgba(0, 74, 198, 0.1);
}

.tt-bento--danger {
  background: rgba(188, 72, 0, 0.05);
  border: 1px solid rgba(188, 72, 0, 0.1);
}

.tt-bento--secondary {
  background: rgba(80, 95, 118, 0.05);
  border: 1px solid rgba(80, 95, 118, 0.1);
}

.tt-bento__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.tt-bento__label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--primary);
}

.tt-bento--danger .tt-bento__label {
  color: #943700;
}
.tt-bento--secondary .tt-bento__label {
  color: var(--on-surface-variant);
}

.tt-bento__value {
  font-size: 32px;
  font-weight: 900;
  line-height: 1;
  color: var(--on-surface);
}

.tt-bento__sub {
  font-size: 12px;
  color: var(--outline);
  margin: 0;
}

/* Progress bar */
.tt-progress {
  width: 100%;
  height: 6px;
  background: var(--surface-container-high);
  border-radius: 9999px;
  overflow: hidden;
}

.tt-progress__bar {
  height: 100%;
  background: var(--primary);
  border-radius: 9999px;
  transition: width 0.4s ease;
}

/* Blocker dots */
.tt-blocker-dots {
  display: flex;
  gap: 4px;
}

.tt-blocker-dot {
  flex: 1;
  height: 6px;
  border-radius: 9999px;
  background: var(--priority-high);
}

.tt-blocker-dot--empty {
  background: var(--surface-container-high);
}

/* Workload bar */
.tt-workload-bar {
  width: 100%;
  height: 6px;
  background: var(--surface-container-high);
  border-radius: 9999px;
  overflow: hidden;
}

.tt-workload-bar__fill {
  display: block;
  width: 70%;
  height: 100%;
  background: #dcfce7;
  border-radius: 9999px;
}

/* ── Responsive ──────────────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .tt-summary {
    grid-template-columns: 1fr;
  }

  .tt-search {
    max-width: 100%;
  }

  .tt-th,
  .tt-td {
    padding: 10px 12px;
  }
}

@media (max-width: 640px) {
  .task-table__bar {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* ── Portal menu (teleported to body, needs :global) ────────────────────────── */
:global(.tt-menu-portal) {
  position: fixed;
  z-index: 9999;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  min-width: 148px;
  overflow: hidden;
}

:global(.tt-menu-portal .tt-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  background: none;
  border: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: #191b23;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.12s;
}

:global(.tt-menu-portal .tt-menu__item:hover) {
  background: #f3f3fe;
}

:global(.tt-menu-portal .tt-menu__item--danger) {
  color: #ba1a1a;
}

:global(.tt-menu-portal .tt-menu__item--danger:hover) {
  background: #fff0f0;
}
</style>
