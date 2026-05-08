<template>
  <!-- Trigger button với badge -->
  <div class="notif-wrap" ref="wrapRef">
    <button
      class="notif-trigger"
      :class="{ 'notif-trigger--active': isOpen }"
      aria-label="Thông báo"
      @click.stop="toggleDropdown"
    >
      <el-icon :size="20"><Bell /></el-icon>
      <span v-if="store.unreadCount > 0" class="notif-badge" aria-label="Thông báo chưa đọc">
        {{ store.unreadCount > 99 ? '99+' : store.unreadCount }}
      </span>
    </button>

    <!-- Dropdown panel -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        class="notif-panel"
        :style="panelStyle"
        @click.stop
      >
        <!-- Header -->
        <div class="notif-panel__header">
          <span class="notif-panel__title">Thông báo</span>
          <div class="notif-panel__header-actions">
            <button
              v-if="store.unreadCount > 0"
              class="notif-panel__action-btn"
              @click="handleMarkAllRead"
            >
              Đánh dấu tất cả đã đọc
            </button>
            <router-link
              to="/notifications"
              class="notif-panel__action-btn notif-panel__action-btn--primary"
              @click="isOpen = false"
            >
              Xem tất cả
            </router-link>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="store.isLoading" class="notif-panel__state">
          <span class="notif-panel__spinner" aria-hidden="true"></span>
          Đang tải...
        </div>

        <!-- Empty -->
        <div v-else-if="recentNotifications.length === 0" class="notif-panel__empty">
          <el-icon :size="32" color="#c3c6d7"><Bell /></el-icon>
          <p>Không có thông báo nào</p>
        </div>

        <!-- List -->
        <ul v-else class="notif-panel__list" role="list">
          <li
            v-for="notif in recentNotifications"
            :key="notif.id"
            class="notif-item"
            :class="{ 'notif-item--unread': !notif.is_read }"
            @click="handleItemClick(notif)"
          >
            <!-- Icon -->
            <div class="notif-item__icon" :class="`notif-item__icon--${getIconType(notif.notification_type)}`">
              <el-icon :size="16"><component :is="getIcon(notif.notification_type)" /></el-icon>
            </div>

            <!-- Content -->
            <div class="notif-item__body">
              <p class="notif-item__message">{{ notif.message }}</p>
              <span class="notif-item__time">{{ formatTime(notif.created_at) }}</span>
            </div>

            <!-- Unread dot -->
            <span v-if="!notif.is_read" class="notif-item__dot" aria-hidden="true"></span>
          </li>
        </ul>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, User, List, Warning } from '@element-plus/icons-vue'
import { useNotificationStore } from '@/stores/notifications'

const store = useNotificationStore()
const router = useRouter()

// ── Dropdown state ────────────────────────────────────────────────────────────
const isOpen = ref(false)
const wrapRef = ref(null)
const panelStyle = ref({})

// Chỉ hiển thị 8 thông báo gần nhất trong dropdown
const recentNotifications = computed(() => store.notifications.slice(0, 8))

// ── Toggle & positioning ──────────────────────────────────────────────────────
function toggleDropdown() {
  if (!isOpen.value) {
    openDropdown()
  } else {
    isOpen.value = false
  }
}

function openDropdown() {
  isOpen.value = true
  store.fetchNotifications()

  // Tính vị trí panel dựa trên trigger button
  const btn = wrapRef.value?.querySelector('.notif-trigger')
  if (btn) {
    const rect = btn.getBoundingClientRect()
    const panelWidth = 380
    let left = rect.right - panelWidth
    if (left < 8) left = 8
    panelStyle.value = {
      top: `${rect.bottom + 8}px`,
      left: `${left}px`,
      width: `${panelWidth}px`,
    }
  }
}

function closeDropdown(e) {
  if (wrapRef.value?.contains(e.target)) return
  if (e.target?.closest?.('.notif-panel')) return
  isOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', closeDropdown, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeDropdown, true)
})

// ── Handlers ──────────────────────────────────────────────────────────────────
async function handleMarkAllRead() {
  await store.markAllAsRead()
}

async function handleItemClick(notif) {
  if (!notif.is_read) {
    await store.markAsRead(notif.id)
  }
  isOpen.value = false

  // Navigate to relevant page
  if (notif.task_id && notif.project_id) {
    router.push(`/projects/${notif.project_id}`)
  } else if (notif.project_id) {
    router.push(`/projects/${notif.project_id}`)
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const ICON_MAP = {
  task_assigned: { icon: List, type: 'task' },
  task_due_soon: { icon: Warning, type: 'warning' },
  project_member_added: { icon: User, type: 'project' },
}

function getIcon(type) {
  return ICON_MAP[type]?.icon ?? Bell
}

function getIconType(type) {
  return ICON_MAP[type]?.type ?? 'default'
}

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
  if (diffDay === 1) return 'Hôm qua'
  if (diffDay < 7) return `${diffDay} ngày trước`
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>

<style scoped>
/* ── Trigger button ──────────────────────────────────────────────────────────── */
.notif-wrap {
  position: relative;
  display: inline-flex;
}

.notif-trigger {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: var(--on-surface-variant, #434655);
  transition: color 0.15s, background-color 0.15s;
}

.notif-trigger:hover,
.notif-trigger--active {
  color: #004ac6;
  background-color: #f3f3fe;
}

.notif-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: #004ac6;
  color: #fff;
  border-radius: 9999px;
  font-size: 9px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #faf8ff;
  line-height: 1;
}

/* ── Panel (teleported to body) ──────────────────────────────────────────────── */
:global(.notif-panel) {
  position: fixed;
  z-index: 9999;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 480px;
}

:global(.notif-panel__header) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 12px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

:global(.notif-panel__title) {
  font-size: 14px;
  font-weight: 700;
  color: #191b23;
}

:global(.notif-panel__header-actions) {
  display: flex;
  align-items: center;
  gap: 8px;
}

:global(.notif-panel__action-btn) {
  font-size: 12px;
  font-weight: 600;
  color: #737686;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  text-decoration: none;
  transition: color 0.15s, background-color 0.15s;
}

:global(.notif-panel__action-btn:hover) {
  color: #004ac6;
  background: #f3f3fe;
}

:global(.notif-panel__action-btn--primary) {
  color: #004ac6;
}

:global(.notif-panel__state) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px;
  font-size: 13px;
  color: #737686;
}

:global(.notif-panel__spinner) {
  width: 16px;
  height: 16px;
  border: 2px solid #c3c6d7;
  border-top-color: #004ac6;
  border-radius: 50%;
  animation: notif-spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes notif-spin {
  to { transform: rotate(360deg); }
}

:global(.notif-panel__empty) {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 24px;
  color: #737686;
  font-size: 13px;
  text-align: center;
}

:global(.notif-panel__list) {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  flex: 1;
}

/* ── Notification item ───────────────────────────────────────────────────────── */
:global(.notif-item) {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.12s;
  border-bottom: 1px solid #f3f3fe;
}

:global(.notif-item:last-child) {
  border-bottom: none;
}

:global(.notif-item:hover) {
  background: #f3f3fe;
}

:global(.notif-item--unread) {
  background: rgba(0, 74, 198, 0.03);
}

:global(.notif-item--unread:hover) {
  background: rgba(0, 74, 198, 0.06);
}

:global(.notif-item__icon) {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

:global(.notif-item__icon--task) {
  background: #dbeafe;
  color: #2563eb;
}

:global(.notif-item__icon--warning) {
  background: #fef3c7;
  color: #d97706;
}

:global(.notif-item__icon--project) {
  background: #dcfce7;
  color: #16a34a;
}

:global(.notif-item__icon--default) {
  background: #ededf9;
  color: #737686;
}

:global(.notif-item__body) {
  flex: 1;
  min-width: 0;
}

:global(.notif-item__message) {
  font-size: 13px;
  font-weight: 400;
  line-height: 18px;
  color: #191b23;
  margin: 0 0 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:global(.notif-item__time) {
  font-size: 11px;
  color: #737686;
}

:global(.notif-item__dot) {
  width: 8px;
  height: 8px;
  background: #004ac6;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 5px;
}
</style>
