<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, List, User, Warning, Check } from '@element-plus/icons-vue'
import { useNotificationStore } from '@/stores/notifications'

const store = useNotificationStore()
const router = useRouter()

// ── Tab state ─────────────────────────────────────────────────────────────────
const activeTab = ref('all') // 'all' | 'unread' | 'task' | 'project'

const TABS = [
  { key: 'all',     label: 'Tất cả' },
  { key: 'unread',  label: 'Chưa đọc' },
  { key: 'task',    label: 'Công việc' },
  { key: 'project', label: 'Dự án' },
]

const TASK_TYPES = ['task_assigned', 'task_due_soon']
const PROJECT_TYPES = ['project_member_added']

const filteredNotifications = computed(() => {
  const all = store.notifications
  if (activeTab.value === 'unread') return all.filter((n) => !n.is_read)
  if (activeTab.value === 'task') return all.filter((n) => TASK_TYPES.includes(n.notification_type))
  if (activeTab.value === 'project') return all.filter((n) => PROJECT_TYPES.includes(n.notification_type))
  return all
})

// Group by date
const groupedNotifications = computed(() => {
  const groups = {}
  for (const notif of filteredNotifications.value) {
    const label = getDateLabel(notif.created_at)
    if (!groups[label]) groups[label] = []
    groups[label].push(notif)
  }
  return groups
})

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
  store.fetchNotifications()
})

// ── Handlers ──────────────────────────────────────────────────────────────────
async function handleMarkAllRead() {
  await store.markAllAsRead()
}

async function handleItemClick(notif) {
  if (!notif.is_read) {
    await store.markAsRead(notif.id)
  }
  if (notif.task_id && notif.project_id) {
    router.push(`/projects/${notif.project_id}`)
  } else if (notif.project_id) {
    router.push(`/projects/${notif.project_id}`)
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const ICON_MAP = {
  task_assigned:        { icon: List,    type: 'task',    label: 'Được giao việc' },
  task_due_soon:        { icon: Warning, type: 'warning', label: 'Sắp đến hạn' },
  project_member_added: { icon: User,    type: 'project', label: 'Thêm vào dự án' },
}

function getIcon(type) { return ICON_MAP[type]?.icon ?? Bell }
function getIconType(type) { return ICON_MAP[type]?.type ?? 'default' }

function formatTime(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60_000)
  const diffHour = Math.floor(diffMs / 3_600_000)
  const diffDay = Math.floor(diffMs / 86_400_000)

  if (diffMin < 1) return 'Vừa xong'
  if (diffMin < 60) return `${diffMin} phút trước`
  if (diffHour < 24) return `${diffHour} giờ trước`
  if (diffDay === 1) return 'Hôm qua lúc ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  if (diffDay < 7) return `${diffDay} ngày trước`
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getDateLabel(iso) {
  if (!iso) return 'Khác'
  const date = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today - 86_400_000)
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (d.getTime() === today.getTime()) return 'Hôm nay'
  if (d.getTime() === yesterday.getTime()) return 'Hôm qua'

  const diffDay = Math.floor((today - d) / 86_400_000)
  if (diffDay < 7) return `${diffDay} ngày trước`

  return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
}
</script>

<template>
  <div class="notif-page">
    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="notif-page__header">
      <div>
        <h2 class="notif-page__title">Thông báo</h2>
        <p class="notif-page__subtitle">
          Cập nhật tiến độ dự án và các hoạt động của nhóm.
        </p>
      </div>
      <button
        v-if="store.unreadCount > 0"
        class="notif-page__mark-all-btn"
        @click="handleMarkAllRead"
      >
        <el-icon :size="16"><Check /></el-icon>
        Đánh dấu tất cả đã đọc
      </button>
    </div>

    <!-- ── Tabs ────────────────────────────────────────────────────────────── -->
    <div class="notif-tabs" role="tablist">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        class="notif-tab"
        :class="{ 'notif-tab--active': activeTab === tab.key }"
        role="tab"
        :aria-selected="activeTab === tab.key"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span
          v-if="tab.key === 'unread' && store.unreadCount > 0"
          class="notif-tab__badge"
        >
          {{ store.unreadCount }}
        </span>
      </button>
    </div>

    <!-- ── Loading ─────────────────────────────────────────────────────────── -->
    <div v-if="store.isLoading" class="notif-page__loading">
      <span class="notif-page__spinner" aria-hidden="true"></span>
      Đang tải thông báo...
    </div>

    <!-- ── Empty state ─────────────────────────────────────────────────────── -->
    <div
      v-else-if="filteredNotifications.length === 0"
      class="notif-page__empty"
    >
      <div class="notif-page__empty-icon">
        <el-icon :size="40" color="#c3c6d7"><Bell /></el-icon>
      </div>
      <h4 class="notif-page__empty-title">Không có thông báo nào</h4>
      <p class="notif-page__empty-desc">
        {{
          activeTab === 'unread'
            ? 'Bạn đã đọc tất cả thông báo.'
            : 'Chưa có thông báo nào. Hãy kiểm tra lại sau.'
        }}
      </p>
    </div>

    <!-- ── Notification groups ─────────────────────────────────────────────── -->
    <div v-else class="notif-groups">
      <section
        v-for="(items, dateLabel) in groupedNotifications"
        :key="dateLabel"
        class="notif-group"
      >
        <!-- Date label -->
        <h3 class="notif-group__label">{{ dateLabel }}</h3>

        <!-- Items -->
        <div class="notif-group__list">
          <div
            v-for="notif in items"
            :key="notif.id"
            class="notif-card"
            :class="{ 'notif-card--unread': !notif.is_read }"
            role="button"
            tabindex="0"
            @click="handleItemClick(notif)"
            @keydown.enter="handleItemClick(notif)"
          >
            <!-- Icon -->
            <div
              class="notif-card__icon"
              :class="`notif-card__icon--${getIconType(notif.notification_type)}`"
              aria-hidden="true"
            >
              <el-icon :size="20"><component :is="getIcon(notif.notification_type)" /></el-icon>
            </div>

            <!-- Body -->
            <div class="notif-card__body">
              <p class="notif-card__message">{{ notif.message }}</p>
              <span class="notif-card__time">{{ formatTime(notif.created_at) }}</span>
            </div>

            <!-- Unread indicator -->
            <span
              v-if="!notif.is_read"
              class="notif-card__dot"
              aria-label="Chưa đọc"
            ></span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* ── Design tokens ───────────────────────────────────────────────────────────── */
.notif-page {
  --primary: #004ac6;
  --primary-container: #2563eb;
  --surface-lowest: #ffffff;
  --surface-container-low: #f3f3fe;
  --surface-container: #ededf9;
  --on-surface: #191b23;
  --on-surface-variant: #434655;
  --outline: #737686;
  --outline-variant: #c3c6d7;
  --border-subtle: #e2e8f0;
}

/* ── Page shell ──────────────────────────────────────────────────────────────── */
.notif-page {
  max-width: 720px;
  margin: 0 auto;
  padding-bottom: 64px;
}

/* ── Header ──────────────────────────────────────────────────────────────────── */
.notif-page__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.notif-page__title {
  font-size: 24px;
  font-weight: 600;
  line-height: 32px;
  letter-spacing: -0.02em;
  color: var(--on-surface);
  margin: 0 0 4px;
}

.notif-page__subtitle {
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: var(--on-surface-variant);
  margin: 0;
}

.notif-page__mark-all-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: none;
  border: none;
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--primary);
  cursor: pointer;
  transition: background-color 0.15s;
  white-space: nowrap;
}

.notif-page__mark-all-btn:hover {
  background: rgba(0, 74, 198, 0.06);
}

/* ── Tabs ────────────────────────────────────────────────────────────────────── */
.notif-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 24px;
  gap: 0;
}

.notif-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 20px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  font-family: inherit;
  font-size: 14px;
  font-weight: 400;
  color: var(--on-surface-variant);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  margin-bottom: -1px;
}

.notif-tab:hover {
  color: var(--primary);
}

.notif-tab--active {
  color: var(--primary);
  font-weight: 700;
  border-bottom-color: var(--primary);
}

.notif-tab__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: var(--primary);
  color: #fff;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 700;
}

/* ── Loading ─────────────────────────────────────────────────────────────────── */
.notif-page__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 64px;
  font-size: 14px;
  color: var(--outline);
}

.notif-page__spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--outline-variant);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Empty state ─────────────────────────────────────────────────────────────── */
.notif-page__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 80px 24px;
  gap: 12px;
}

.notif-page__empty-icon {
  width: 80px;
  height: 80px;
  background: var(--surface-container-low);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.notif-page__empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--on-surface);
  margin: 0;
}

.notif-page__empty-desc {
  font-size: 14px;
  color: var(--on-surface-variant);
  margin: 0;
  max-width: 320px;
}

/* ── Groups ──────────────────────────────────────────────────────────────────── */
.notif-groups {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.notif-group__label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--outline);
  margin: 0 0 12px;
}

.notif-group__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ── Notification card ───────────────────────────────────────────────────────── */
.notif-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: var(--surface-lowest);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  cursor: pointer;
  transition: box-shadow 0.15s, background-color 0.12s;
  outline: none;
}

.notif-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
}

.notif-card:focus-visible {
  box-shadow: 0 0 0 3px rgba(0, 74, 198, 0.2);
}

.notif-card--unread {
  background: rgba(0, 74, 198, 0.03);
  border-color: rgba(0, 74, 198, 0.12);
}

.notif-card--unread:hover {
  background: rgba(0, 74, 198, 0.06);
}

/* Icon */
.notif-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notif-card__icon--task {
  background: #dbeafe;
  color: #2563eb;
}

.notif-card__icon--warning {
  background: #fef3c7;
  color: #d97706;
}

.notif-card__icon--project {
  background: #dcfce7;
  color: #16a34a;
}

.notif-card__icon--default {
  background: var(--surface-container);
  color: var(--outline);
}

/* Body */
.notif-card__body {
  flex: 1;
  min-width: 0;
}

.notif-card__message {
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: var(--on-surface);
  margin: 0 0 6px;
}

.notif-card--unread .notif-card__message {
  font-weight: 500;
}

.notif-card__time {
  font-size: 12px;
  color: var(--outline);
}

/* Unread dot */
.notif-card__dot {
  width: 10px;
  height: 10px;
  background: var(--primary);
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 5px;
}

/* ── Responsive ──────────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .notif-page__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .notif-tabs {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .notif-tab {
    padding: 10px 14px;
    white-space: nowrap;
  }
}
</style>
