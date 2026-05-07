<template>
  <header class="topbar">
    <!-- Search -->
    <div class="topbar__search">
      <el-icon class="topbar__search-icon" :size="18"><Search /></el-icon>
      <input
        v-model="searchQuery"
        class="topbar__search-input"
        type="text"
        placeholder="Tìm kiếm dự án, công việc hoặc thành viên..."
        aria-label="Tìm kiếm"
        @keydown.enter="handleSearchSubmit"
      />
    </div>

    <!-- Right actions -->
    <div class="topbar__right">
      <div class="topbar__actions">
        <button class="topbar__icon-btn" aria-label="Thông báo">
          <el-icon :size="20"><Bell /></el-icon>
        </button>
        <button class="topbar__icon-btn" aria-label="Trợ giúp">
          <el-icon :size="20"><QuestionFilled /></el-icon>
        </button>
      </div>

      <div class="topbar__divider" aria-hidden="true"></div>

      <!-- User menu -->
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="topbar__user" tabindex="0" role="button" aria-label="Menu người dùng">
          <div class="topbar__avatar" aria-hidden="true">
            {{ userInitials }}
          </div>
          <span class="topbar__username">{{ authStore.user?.username }}</span>
          <el-icon :size="14" class="topbar__chevron"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              Hồ sơ cá nhân
            </el-dropdown-item>
            <el-dropdown-item command="logout" divided>
              <el-icon><SwitchButton /></el-icon>
              Đăng xuất
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Search,
  Bell,
  QuestionFilled,
  User,
  ArrowDown,
  SwitchButton,
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useProjectStore } from '@/stores/projects'

const authStore = useAuthStore()
const projectStore = useProjectStore()
const router = useRouter()
const route = useRoute()

const searchQuery = ref('')

/** Hai ký tự đầu của username dùng cho avatar placeholder */
const userInitials = computed(() => {
  const name = authStore.user?.username ?? ''
  return name.slice(0, 2).toUpperCase() || 'U'
})

/**
 * Tìm kiếm dự án: lọc client-side trên danh sách projects đã tải.
 * Nhấn Enter để điều hướng về dashboard với query param ?search=
 */
function handleSearchSubmit() {
  const q = searchQuery.value.trim()
  if (!q) return
  router.push({ name: 'dashboard', query: { search: q } })
}

function handleCommand(command) {
  if (command === 'logout') {
    authStore.logout()
  } else if (command === 'profile') {
    router.push('/profile')
  }
}
</script>

<style scoped>
/* ── Design tokens ───────────────────────────────────────────────────────────── */
.topbar {
  --surface: #faf8ff;
  --surface-container-low: #f3f3fe;
  --on-surface: #191b23;
  --on-surface-variant: #434655;
  --outline: #737686;
  --border-subtle: #e2e8f0;
  --primary: #004ac6;
}

/* ── Shell ───────────────────────────────────────────────────────────────────── */
.topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  height: 64px;
  background-color: var(--surface);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  gap: 24px;
}

/* ── Search ──────────────────────────────────────────────────────────────────── */
.topbar__search {
  position: relative;
  flex: 1;
  max-width: 480px;
}

.topbar__search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--outline);
  pointer-events: none;
}

.topbar__search-input {
  width: 100%;
  background: var(--surface-container-low);
  border: none;
  border-radius: 9999px;
  padding: 8px 16px 8px 40px;
  font-family: inherit;
  /* body-sm — DESIGN.md */
  font-size: 13px;
  font-weight: 400;
  line-height: 18px;
  color: var(--on-surface);
  outline: none;
  transition: box-shadow 0.15s;
}

.topbar__search-input::placeholder {
  color: var(--outline);
}

.topbar__search-input:focus {
  box-shadow: 0 0 0 2px rgba(0, 74, 198, 0.2);
}

/* ── Right section ───────────────────────────────────────────────────────────── */
.topbar__right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.topbar__actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.topbar__icon-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: var(--on-surface-variant);
  transition:
    color 0.15s,
    background-color 0.15s;
}

.topbar__icon-btn:hover {
  color: var(--primary);
  background-color: var(--surface-container-low);
}

.topbar__divider {
  width: 1px;
  height: 28px;
  background: var(--border-subtle);
}

/* ── User ────────────────────────────────────────────────────────────────────── */
.topbar__user {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background-color 0.15s;
  outline: none;
}

.topbar__user:hover {
  background-color: var(--surface-container-low);
}

.topbar__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--primary);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
  border: 1px solid var(--border-subtle);
}

.topbar__username {
  /* body-base semibold — DESIGN.md */
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: var(--on-surface);
}

.topbar__chevron {
  color: var(--on-surface-variant);
}
</style>
