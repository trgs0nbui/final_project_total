<template>
  <aside class="sidebar">
    <!-- Brand -->
    <div class="sidebar__brand">
      <div class="sidebar__brand-icon" aria-hidden="true">
        <el-icon :size="22" color="#eeefff"><Check /></el-icon>
      </div>
      <div>
        <h1 class="sidebar__brand-name">TaskFlow</h1>
        <p class="sidebar__brand-sub">Không gian làm việc</p>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="sidebar__nav" aria-label="Điều hướng chính">
      <router-link
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="sidebar__nav-item"
        :class="{ 'sidebar__nav-item--active': isActive(item) }"
      >
        <el-icon :size="20"><component :is="item.icon" /></el-icon>
        <span class="sidebar__nav-label">{{ item.label }}</span>
      </router-link>
    </nav>

    <!-- New Project button -->
    <div class="sidebar__footer">
      <button class="sidebar__new-btn" @click="emit('new-project')">
        <el-icon :size="18"><Plus /></el-icon>
        <span>Tạo dự án</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Check, Plus, Odometer, FolderOpened, List, User, Setting } from '@element-plus/icons-vue'

const emit = defineEmits(['new-project'])
const route = useRoute()

/** Các mục điều hướng — icon từ @element-plus/icons-vue */
const navItems = [
  { to: '/dashboard', label: 'Tổng quan', icon: Odometer },
  { to: '/projects', label: 'Dự án', icon: FolderOpened },
  { to: '/tasks', label: 'Công việc', icon: List },
  { to: '/team', label: 'Nhóm', icon: User },
  { to: '/settings', label: 'Cài đặt', icon: Setting },
]

/**
 * Kiểm tra active state cho từng nav item.
 * - /projects cũng active khi đang ở /projects/:id hoặc /projects/:id/members
 * - Các route khác dùng exact match
 */
function isActive(item) {
  if (item.to === '/projects') {
    return route.path === '/projects' || route.path.startsWith('/projects/')
  }
  return route.path === item.to
}
</script>

<style scoped>
/* ── Design tokens ───────────────────────────────────────────────────────────── */
.sidebar {
  --sidebar-bg: #0f172a;
  --sidebar-text: rgba(255, 255, 255, 0.7);
  --sidebar-text-active: #dbe1ff;
  --sidebar-active-bg: rgba(0, 74, 198, 0.15);
  --sidebar-active-border: #b4c5ff;
  --sidebar-hover-bg: rgba(255, 255, 255, 0.06);
  --primary: #004ac6;
  --primary-container: #2563eb;
  --on-primary-container: #eeefff;
  --border-subtle: #e2e8f0;
}

/* ── Shell ───────────────────────────────────────────────────────────────────── */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 260px;
  height: 100vh;
  background-color: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  padding: 24px 0;
  z-index: 50;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

/* ── Brand ───────────────────────────────────────────────────────────────────── */
.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 24px;
  margin-bottom: 32px;
}

.sidebar__brand-icon {
  width: 40px;
  height: 40px;
  background-color: var(--primary-container);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sidebar__brand-name {
  /* h2 — DESIGN.md */
  font-size: 20px;
  font-weight: 900;
  line-height: 28px;
  letter-spacing: -0.01em;
  color: #ffffff;
  margin: 0;
}

.sidebar__brand-sub {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.3);
  margin: 0;
}

/* ── Nav ─────────────────────────────────────────────────────────────────────── */
.sidebar__nav {
  flex: 1;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar__nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  text-decoration: none;
  color: var(--sidebar-text);
  transition:
    background-color 0.15s,
    color 0.15s;
  border-left: 3px solid transparent;
}

.sidebar__nav-item:hover {
  background-color: var(--sidebar-hover-bg);
  color: #ffffff;
}

.sidebar__nav-item--active {
  background-color: var(--sidebar-active-bg);
  color: var(--sidebar-text-active);
  border-left-color: var(--sidebar-active-border);
}

.sidebar__nav-label {
  /* label-caps — DESIGN.md */
  font-size: 11px;
  font-weight: 700;
  line-height: 16px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* ── Footer / New Project ────────────────────────────────────────────────────── */
.sidebar__footer {
  padding: 0 16px;
  margin-top: 16px;
}

.sidebar__new-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background-color: var(--primary);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 0.15s,
    transform 0.1s;
}

.sidebar__new-btn:hover {
  background-color: var(--primary-container);
}

.sidebar__new-btn:active {
  transform: scale(0.97);
}
</style>
