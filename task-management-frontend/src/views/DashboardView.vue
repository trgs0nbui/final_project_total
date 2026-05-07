<script setup>
/**
 * DashboardView — trang tổng quan thống kê.
 * Hiển thị: greeting, stat cards (dự án / tasks được giao / thành viên),
 * danh sách tasks ưu tiên cao cần làm, và dự án gần đây.
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { FolderOpened, List, User, ArrowRight, Plus, Warning, Clock } from '@element-plus/icons-vue'
import { useProjectStore } from '@/stores/projects'
import { useTaskStore } from '@/stores/tasks'
import { useAuthStore } from '@/stores/auth'
import SkeletonCard from '@/components/common/SkeletonCard.vue'

const router = useRouter()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const authStore = useAuthStore()

// ── State ─────────────────────────────────────────────────────────────────────
const memberStats = ref(null)
const isStatsLoading = ref(false)

// ── Computed ──────────────────────────────────────────────────────────────────
const projects = computed(() => projectStore.projects)
const isLoading = computed(() => projectStore.isLoading)
const storeError = computed(() => projectStore.error)
const myTaskStats = computed(() => taskStore.myTaskStats)
const username = computed(() => authStore.user?.username ?? 'bạn')

/** 4 dự án gần nhất */
const recentProjects = computed(() => projects.value.slice(0, 4))

/** Tasks high priority chưa done — lấy từ myTasks */
const highPriorityTasks = computed(() =>
  taskStore.myTasks.filter((t) => t.priority === 'high' && t.status !== 'done').slice(0, 5),
)

const stats = computed(() => [
  {
    label: 'Dự án đang hoạt động',
    value: isLoading.value ? '…' : projects.value.length,
    icon: FolderOpened,
    color: '#004ac6',
    bg: 'rgba(0, 74, 198, 0.08)',
    to: '/projects',
  },
  {
    label: 'Công việc được giao',
    value: myTaskStats.value ? myTaskStats.value.total_assigned : isStatsLoading.value ? '…' : '—',
    icon: List,
    color: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.08)',
    to: '/tasks',
  },
  {
    label: 'Thành viên nhóm',
    value: memberStats.value ? memberStats.value.total_members : isStatsLoading.value ? '…' : '—',
    icon: User,
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.08)',
    to: '/team',
  },
])

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  isStatsLoading.value = true
  await Promise.all([
    projectStore.fetchProjects(),
    taskStore.fetchMyTaskStats(),
    taskStore.fetchMyTasks({ priority: 'high' }),
    projectStore.fetchMemberStats().then((s) => {
      memberStats.value = s
    }),
  ])
  isStatsLoading.value = false
})

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  todo: { label: 'Chờ xử lý', bg: '#F1F5F9', color: '#737686' },
  in_progress: { label: 'Đang thực hiện', bg: '#DBEAFE', color: '#2563eb' },
  done: { label: 'Hoàn thành', bg: '#DCFCE7', color: '#16a34a' },
}

function getStatusConfig(s) {
  return STATUS_CONFIG[s] ?? { label: s, bg: '#f3f3fe', color: '#737686' }
}

function formatDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  const today = new Date()
  const isOverdue = d < today
  return {
    text: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    overdue: isOverdue,
  }
}

// ── Handlers ──────────────────────────────────────────────────────────────────
function goToProject(project) {
  router.push(`/projects/${project.id}`)
}

function goToProjects() {
  router.push('/projects')
}

function goToTasks() {
  router.push('/tasks')
}

function goToTask(task) {
  router.push(`/projects/${task.project}/tasks/${task.id}`)
}
</script>

<template>
  <div class="dashboard">
    <!-- ── Welcome header ──────────────────────────────────────────────── -->
    <div class="dashboard__header">
      <div>
        <h2 class="dashboard__title">Xin chào, {{ username }} 👋</h2>
        <p class="dashboard__subtitle">Đây là tổng quan hoạt động của bạn hôm nay.</p>
      </div>
      <button class="dashboard__new-btn" @click="goToProjects">
        <el-icon :size="16"><Plus /></el-icon>
        <span>Tạo dự án</span>
      </button>
    </div>

    <!-- ── API error ────────────────────────────────────────────────────── -->
    <el-alert
      v-if="storeError && !isLoading"
      :title="storeError"
      type="error"
      show-icon
      :closable="false"
      class="dashboard__error"
    />

    <!-- ── Stats cards ──────────────────────────────────────────────────── -->
    <div class="stats-grid">
      <router-link v-for="stat in stats" :key="stat.label" :to="stat.to" class="stat-card">
        <div class="stat-card__icon" :style="{ background: stat.bg, color: stat.color }">
          <el-icon :size="22"><component :is="stat.icon" /></el-icon>
        </div>
        <div class="stat-card__body">
          <p class="stat-card__label">{{ stat.label }}</p>
          <p class="stat-card__value" :style="{ color: stat.color }">{{ stat.value }}</p>
        </div>
        <el-icon class="stat-card__arrow" :size="16"><ArrowRight /></el-icon>
      </router-link>
    </div>

    <!-- ── Two-column layout ────────────────────────────────────────────── -->
    <div class="dashboard__columns">
      <!-- ── High priority tasks ──────────────────────────────────────── -->
      <section class="dashboard__section">
        <div class="dashboard__section-header">
          <div class="dashboard__section-title-group">
            <h3 class="dashboard__section-title">Công việc ưu tiên cao</h3>
            <span
              v-if="myTaskStats && myTaskStats.high_priority_todo > 0"
              class="dashboard__badge dashboard__badge--danger"
            >
              {{ myTaskStats.high_priority_todo }} cần xử lý
            </span>
          </div>
          <button class="dashboard__see-all" @click="goToTasks">
            Xem tất cả
            <el-icon :size="14"><ArrowRight /></el-icon>
          </button>
        </div>

        <!-- Loading -->
        <div v-if="isStatsLoading" class="dashboard__task-skeleton">
          <div v-for="i in 3" :key="i" class="task-skeleton-row"></div>
        </div>

        <!-- Task list -->
        <div v-else-if="highPriorityTasks.length > 0" class="priority-tasks">
          <div
            v-for="task in highPriorityTasks"
            :key="task.id"
            class="priority-task-item"
            role="button"
            tabindex="0"
            @click="goToTask(task)"
            @keydown.enter="goToTask(task)"
          >
            <div class="priority-task-item__dot" aria-hidden="true"></div>
            <div class="priority-task-item__info">
              <p class="priority-task-item__title">{{ task.title }}</p>
              <div class="priority-task-item__meta">
                <span
                  class="priority-task-item__status"
                  :style="{
                    background: getStatusConfig(task.status).bg,
                    color: getStatusConfig(task.status).color,
                  }"
                >
                  {{ getStatusConfig(task.status).label }}
                </span>
                <span
                  v-if="task.due_date"
                  class="priority-task-item__due"
                  :class="{
                    'priority-task-item__due--overdue': formatDate(task.due_date)?.overdue,
                  }"
                >
                  <el-icon :size="11"><Clock /></el-icon>
                  {{ formatDate(task.due_date)?.text }}
                </span>
              </div>
            </div>
            <el-icon class="priority-task-item__arrow" :size="14"><ArrowRight /></el-icon>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="dashboard__empty-state">
          <el-icon :size="28" color="#c3c6d7"><Warning /></el-icon>
          <p>Không có công việc ưu tiên cao nào.</p>
        </div>

        <!-- Overdue alert -->
        <div v-if="myTaskStats && myTaskStats.overdue > 0" class="dashboard__overdue-alert">
          <el-icon :size="14"><Warning /></el-icon>
          <span>{{ myTaskStats.overdue }} công việc đã quá hạn</span>
          <button class="dashboard__overdue-link" @click="goToTasks">Xem ngay</button>
        </div>
      </section>

      <!-- ── Recent projects ──────────────────────────────────────────── -->
      <section class="dashboard__section">
        <div class="dashboard__section-header">
          <h3 class="dashboard__section-title">Dự án gần đây</h3>
          <button class="dashboard__see-all" @click="goToProjects">
            Xem tất cả
            <el-icon :size="14"><ArrowRight /></el-icon>
          </button>
        </div>

        <!-- Skeleton -->
        <SkeletonCard v-if="isLoading" :count="4" />

        <!-- Project list -->
        <div v-else-if="recentProjects.length > 0" class="recent-projects">
          <div
            v-for="project in recentProjects"
            :key="project.id"
            class="recent-project-item"
            role="button"
            tabindex="0"
            @click="goToProject(project)"
            @keydown.enter="goToProject(project)"
          >
            <div class="recent-project-item__avatar" aria-hidden="true">
              {{ (project.key ?? project.name).slice(0, 2).toUpperCase() }}
            </div>
            <div class="recent-project-item__info">
              <p class="recent-project-item__name">{{ project.name }}</p>
              <p class="recent-project-item__key">{{ project.key ?? '—' }}</p>
            </div>
            <el-icon class="recent-project-item__arrow" :size="16"><ArrowRight /></el-icon>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="dashboard__empty-state">
          <el-icon :size="28" color="#c3c6d7"><FolderOpened /></el-icon>
          <p>Bạn chưa có dự án nào.</p>
          <el-button type="primary" size="small" :icon="Plus" @click="goToProjects">
            Tạo dự án đầu tiên
          </el-button>
        </div>
      </section>
    </div>

    <!-- ── Task progress summary ────────────────────────────────────────── -->
    <section v-if="myTaskStats && myTaskStats.total_assigned > 0" class="dashboard__progress">
      <h3 class="dashboard__section-title" style="margin-bottom: 16px">
        Tiến độ công việc của bạn
      </h3>
      <div class="progress-grid">
        <div class="progress-card progress-card--blue">
          <p class="progress-card__label">Đang thực hiện</p>
          <p class="progress-card__value">{{ myTaskStats.in_progress }}</p>
        </div>
        <div class="progress-card progress-card--red">
          <p class="progress-card__label">Ưu tiên cao</p>
          <p class="progress-card__value">{{ myTaskStats.high_priority_todo }}</p>
        </div>
        <div class="progress-card progress-card--green">
          <p class="progress-card__label">Đã hoàn thành</p>
          <p class="progress-card__value">{{ myTaskStats.done }}</p>
        </div>
        <div class="progress-card progress-card--orange">
          <p class="progress-card__label">Quá hạn</p>
          <p class="progress-card__value">{{ myTaskStats.overdue }}</p>
        </div>
      </div>

      <!-- Completion progress bar -->
      <div class="dashboard__completion">
        <div class="dashboard__completion-header">
          <span class="dashboard__completion-label">Tỷ lệ hoàn thành</span>
          <span class="dashboard__completion-pct">
            {{
              myTaskStats.total_assigned > 0
                ? Math.round((myTaskStats.done / myTaskStats.total_assigned) * 100)
                : 0
            }}%
          </span>
        </div>
        <div class="dashboard__progress-bar">
          <div
            class="dashboard__progress-fill"
            :style="{
              width:
                myTaskStats.total_assigned > 0
                  ? Math.round((myTaskStats.done / myTaskStats.total_assigned) * 100) + '%'
                  : '0%',
            }"
          ></div>
        </div>
        <p class="dashboard__completion-sub">
          {{ myTaskStats.done }} / {{ myTaskStats.total_assigned }} công việc hoàn thành
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ── Design tokens ───────────────────────────────────────────────────────────── */
.dashboard {
  --primary: #004ac6;
  --surface: #faf8ff;
  --surface-container-lowest: #ffffff;
  --surface-container-low: #f3f3fe;
  --surface-container: #ededf9;
  --on-surface: #191b23;
  --on-surface-variant: #434655;
  --outline: #737686;
  --border-subtle: #e2e8f0;
  --error: #ba1a1a;
}

/* ── Page shell ──────────────────────────────────────────────────────────────── */
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 48px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* ── Header ──────────────────────────────────────────────────────────────────── */
.dashboard__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.dashboard__title {
  font-size: 24px;
  font-weight: 700;
  line-height: 32px;
  letter-spacing: -0.02em;
  color: var(--on-surface);
  margin: 0 0 4px;
}

.dashboard__subtitle {
  font-size: 14px;
  color: var(--on-surface-variant);
  margin: 0;
}

.dashboard__new-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--primary);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.dashboard__new-btn:hover {
  opacity: 0.88;
}

/* ── Error ───────────────────────────────────────────────────────────────────── */
.dashboard__error {
  border-radius: 8px;
}

/* ── Stats grid ──────────────────────────────────────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: var(--surface-container-lowest);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition:
    box-shadow 0.15s,
    border-color 0.15s;
}

.stat-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border-color: #c3c6d7;
}

.stat-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card__body {
  flex: 1;
  min-width: 0;
}

.stat-card__label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--outline);
  margin: 0 0 4px;
}

.stat-card__value {
  font-size: 28px;
  font-weight: 900;
  line-height: 1;
  margin: 0;
}

.stat-card__arrow {
  color: var(--outline);
  flex-shrink: 0;
}

/* ── Two-column layout ───────────────────────────────────────────────────────── */
.dashboard__columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

/* ── Section ─────────────────────────────────────────────────────────────────── */
.dashboard__section {
  background: var(--surface-container-lowest);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dashboard__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dashboard__section-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dashboard__section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--on-surface);
  margin: 0;
}

.dashboard__badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
}

.dashboard__badge--danger {
  background: rgba(186, 26, 26, 0.1);
  color: var(--error);
}

.dashboard__see-all {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--primary);
  cursor: pointer;
}

.dashboard__see-all:hover {
  text-decoration: underline;
}

/* ── Task skeleton ───────────────────────────────────────────────────────────── */
.dashboard__task-skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-skeleton-row {
  height: 52px;
  background: var(--surface-container-low);
  border-radius: 8px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* ── Priority tasks ──────────────────────────────────────────────────────────── */
.priority-tasks {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.priority-task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s;
  outline: none;
}

.priority-task-item:hover,
.priority-task-item:focus-visible {
  background-color: var(--surface-container-low);
}

.priority-task-item__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  flex-shrink: 0;
}

.priority-task-item__info {
  flex: 1;
  min-width: 0;
}

.priority-task-item__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--on-surface);
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.priority-task-item__meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.priority-task-item__status {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 700;
}

.priority-task-item__due {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--outline);
}

.priority-task-item__due--overdue {
  color: var(--error);
  font-weight: 700;
}

.priority-task-item__arrow {
  color: var(--outline);
  flex-shrink: 0;
}

/* ── Overdue alert ───────────────────────────────────────────────────────────── */
.dashboard__overdue-alert {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: rgba(186, 26, 26, 0.06);
  border: 1px solid rgba(186, 26, 26, 0.15);
  border-radius: 8px;
  font-size: 13px;
  color: var(--error);
}

.dashboard__overdue-link {
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  color: var(--error);
  cursor: pointer;
  text-decoration: underline;
  margin-left: auto;
}

/* ── Recent projects ─────────────────────────────────────────────────────────── */
.recent-projects {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.recent-project-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s;
  outline: none;
}

.recent-project-item:hover,
.recent-project-item:focus-visible {
  background-color: var(--surface-container-low);
}

.recent-project-item__avatar {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(0, 74, 198, 0.1);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.recent-project-item__info {
  flex: 1;
  min-width: 0;
}

.recent-project-item__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--on-surface);
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-project-item__key {
  font-size: 12px;
  color: var(--outline);
  margin: 0;
}

.recent-project-item__arrow {
  color: var(--outline);
  flex-shrink: 0;
}

/* ── Empty state ─────────────────────────────────────────────────────────────── */
.dashboard__empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 0;
  color: var(--on-surface-variant);
  font-size: 14px;
  text-align: center;
}

/* ── Progress section ────────────────────────────────────────────────────────── */
.dashboard__progress {
  background: var(--surface-container-lowest);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 24px;
}

.progress-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.progress-card {
  border-radius: 10px;
  padding: 16px;
  text-align: center;
}

.progress-card--blue {
  background: rgba(37, 99, 235, 0.06);
  border: 1px solid rgba(37, 99, 235, 0.12);
}

.progress-card--red {
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.12);
}

.progress-card--green {
  background: rgba(22, 163, 74, 0.06);
  border: 1px solid rgba(22, 163, 74, 0.12);
}

.progress-card--orange {
  background: rgba(234, 88, 12, 0.06);
  border: 1px solid rgba(234, 88, 12, 0.12);
}

.progress-card__label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--outline);
  margin: 0 0 8px;
}

.progress-card__value {
  font-size: 28px;
  font-weight: 900;
  color: var(--on-surface);
  margin: 0;
  line-height: 1;
}

/* ── Completion bar ──────────────────────────────────────────────────────────── */
.dashboard__completion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.dashboard__completion-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--on-surface-variant);
}

.dashboard__completion-pct {
  font-size: 16px;
  font-weight: 900;
  color: var(--primary);
}

.dashboard__progress-bar {
  width: 100%;
  height: 8px;
  background: var(--surface-container);
  border-radius: 9999px;
  overflow: hidden;
  margin-bottom: 8px;
}

.dashboard__progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 9999px;
  transition: width 0.5s ease;
}

.dashboard__completion-sub {
  font-size: 12px;
  color: var(--outline);
  margin: 0;
}

/* ── Responsive ──────────────────────────────────────────────────────────────── */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .progress-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dashboard__columns {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .dashboard__header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
