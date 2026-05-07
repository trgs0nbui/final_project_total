<script setup>
/**
 * ProjectMembersView — quản lý thành viên dự án.
 *
 * Chỉ owner mới có thể thêm/xóa thành viên.
 * Mọi thành viên đều có thể xem danh sách.
 *
 * Route: /projects/:id/members
 */
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  UserFilled,
  Delete,
  ArrowLeft,
  Plus,
  CircleCheck,
  Warning,
} from '@element-plus/icons-vue'
import { useProjectStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/services/apiClient'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const authStore = useAuthStore()

const projectId = computed(() => route.params.id)

// ── State ─────────────────────────────────────────────────────────────────────

const members = ref([])
const isLoading = ref(false)
const storeError = ref('')

// ── Add member drawer ─────────────────────────────────────────────────────────

const showAddDrawer = ref(false)
const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)
const addingUserId = ref(null)

/** Track which membership IDs are currently being removed */
const removingIds = ref(new Set())

/** Track user IDs that were successfully added in this drawer session */
const addedUserIds = ref(new Set())

// ── Computed ──────────────────────────────────────────────────────────────────

const currentProject = computed(() => projectStore.currentProject)

const isOwner = computed(() =>
  currentProject.value && authStore.user
    ? String(currentProject.value.owner?.id) === String(authStore.user.id)
    : false,
)

const ownerCount = computed(() => members.value.filter((m) => m.role === 'owner').length)
const memberCount = computed(() => members.value.length)

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  await loadData()
})

async function loadData() {
  isLoading.value = true
  storeError.value = ''
  try {
    if (!currentProject.value || currentProject.value.id !== projectId.value) {
      await projectStore.fetchProjectById(projectId.value)
    }
    members.value = await projectStore.fetchMembers(projectId.value)
  } catch (err) {
    storeError.value = err.message || 'Không thể tải dữ liệu.'
  } finally {
    isLoading.value = false
  }
}

// ── Remove member ─────────────────────────────────────────────────────────────

async function handleRemoveMember(membership) {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc chắn muốn xóa @${membership.user.username} khỏi dự án không?`,
      'Xác nhận xóa thành viên',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      },
    )

    // Mark as removing for per-row loading state
    const next = new Set(removingIds.value)
    next.add(membership.id)
    removingIds.value = next

    const ok = await projectStore.removeMember(projectId.value, membership.user.id)

    if (ok) {
      members.value = members.value.filter((m) => m.id !== membership.id)
      ElMessage.success(`Đã xóa @${membership.user.username} khỏi dự án.`)
    } else {
      ElMessage.error(projectStore.error || 'Không thể xóa thành viên.')
    }
  } catch {
    // Người dùng nhấn Hủy — không làm gì
  } finally {
    const next = new Set(removingIds.value)
    next.delete(membership.id)
    removingIds.value = next
  }
}

// ── Add member search ─────────────────────────────────────────────────────────

let searchTimer = null

function onSearchInput() {
  clearTimeout(searchTimer)
  if (searchQuery.value.trim().length < 2) {
    searchResults.value = []
    return
  }
  searchTimer = setTimeout(doSearch, 350)
}

async function doSearch() {
  isSearching.value = true
  try {
    searchResults.value = await projectStore.searchUsersToAdd(
      projectId.value,
      searchQuery.value.trim(),
    )
  } finally {
    isSearching.value = false
  }
}

async function handleAddMember(user) {
  addingUserId.value = user.id
  try {
    const membership = await projectStore.addMember(projectId.value, user.id)
    if (membership) {
      members.value.push(membership)
      // Mark as added so the button changes to "Đã thêm"
      const next = new Set(addedUserIds.value)
      next.add(user.id)
      addedUserIds.value = next
      ElMessage.success(`Đã thêm @${user.username} vào dự án!`)
    } else {
      ElMessage.error(projectStore.error || 'Không thể thêm thành viên.')
    }
  } finally {
    addingUserId.value = null
  }
}

function openAddDrawer() {
  searchQuery.value = ''
  searchResults.value = []
  addedUserIds.value = new Set()
  showAddDrawer.value = true
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROLE_CONFIG = {
  owner: {
    label: 'Owner',
    bg: 'rgba(0,74,198,0.1)',
    color: '#004ac6',
    border: 'rgba(0,74,198,0.2)',
  },
  member: { label: 'Member', bg: '#f3f3fe', color: '#434655', border: '#e2e8f0' },
}

function getRoleConfig(role) {
  return ROLE_CONFIG[role] ?? ROLE_CONFIG.member
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getInitials(user) {
  return (user?.full_name || user?.username || '').slice(0, 2).toUpperCase() || '?'
}
</script>

<template>
  <div class="pm-page">
    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <div class="pm-header">
      <div class="pm-header__left">
        <nav class="pm-breadcrumb" aria-label="Điều hướng">
          <button class="pm-breadcrumb__link" @click="router.push('/dashboard')">Dự án</button>
          <span class="pm-breadcrumb__sep" aria-hidden="true">›</span>
          <button class="pm-breadcrumb__link" @click="router.push(`/projects/${projectId}`)">
            {{ currentProject?.name || '...' }}
          </button>
          <span class="pm-breadcrumb__sep" aria-hidden="true">›</span>
          <span class="pm-breadcrumb__current">Thành viên</span>
        </nav>

        <h1 class="pm-header__title">Quản lý thành viên</h1>
        <p class="pm-header__subtitle">
          Quản lý quyền truy cập và vai trò của các thành viên trong dự án.
        </p>
      </div>

      <div class="pm-header__actions">
        <button class="pm-btn pm-btn--outline" @click="router.push(`/projects/${projectId}`)">
          <el-icon :size="16"><ArrowLeft /></el-icon>
          Quay lại dự án
        </button>
        <button v-if="isOwner" class="pm-btn pm-btn--primary" @click="openAddDrawer">
          <el-icon :size="16"><Plus /></el-icon>
          Thêm thành viên
        </button>
      </div>
    </div>

    <!-- ── Stats bar ────────────────────────────────────────────────────── -->
    <div class="pm-stats">
      <div class="pm-stat-card">
        <span class="pm-stat-card__label">Tổng thành viên</span>
        <div class="pm-stat-card__value-row">
          <span class="pm-stat-card__value">{{ memberCount }}</span>
        </div>
      </div>
      <div class="pm-stat-card">
        <span class="pm-stat-card__label">Owner</span>
        <span class="pm-stat-card__value">{{ ownerCount }}</span>
      </div>
      <div class="pm-stat-card">
        <span class="pm-stat-card__label">Member</span>
        <span class="pm-stat-card__value">{{ memberCount - ownerCount }}</span>
      </div>
      <div class="pm-stat-card pm-stat-card--accent">
        <span class="pm-stat-card__label">Dự án</span>
        <span class="pm-stat-card__value pm-stat-card__value--name">
          {{ currentProject?.key || '—' }}
        </span>
      </div>
    </div>

    <!-- ── API error ────────────────────────────────────────────────────── -->
    <el-alert
      v-if="storeError"
      :title="storeError"
      type="error"
      show-icon
      :closable="false"
      class="pm-error"
    />

    <!-- ── Members table ────────────────────────────────────────────────── -->
    <div class="pm-table-card" v-loading="isLoading" element-loading-text="Đang tải...">
      <!-- Table toolbar -->
      <div class="pm-table-toolbar">
        <span class="pm-table-toolbar__count"> {{ memberCount }} thành viên </span>
      </div>

      <div class="pm-table-wrap">
        <table class="pm-table">
          <thead>
            <tr class="pm-thead-row">
              <th class="pm-th">Thành viên</th>
              <th class="pm-th">Vai trò</th>
              <th class="pm-th">Ngày tham gia</th>
              <th class="pm-th pm-th--action"></th>
            </tr>
          </thead>
          <tbody>
            <!-- Empty state -->
            <tr v-if="members.length === 0 && !isLoading">
              <td colspan="4" class="pm-empty">Chưa có thành viên nào.</td>
            </tr>

            <tr v-for="membership in members" :key="membership.id" class="pm-row">
              <!-- Member info -->
              <td class="pm-td">
                <div class="pm-member-cell">
                  <div class="pm-avatar">
                    <img
                      v-if="membership.user.avatar_url"
                      :src="membership.user.avatar_url"
                      :alt="membership.user.username"
                      class="pm-avatar__img"
                    />
                    <span v-else class="pm-avatar__initials">
                      {{ getInitials(membership.user) }}
                    </span>
                  </div>
                  <div class="pm-member-info">
                    <span class="pm-member-name">
                      {{ membership.user.full_name || membership.user.username }}
                    </span>
                    <span class="pm-member-username">@{{ membership.user.username }}</span>
                    <span class="pm-member-email">{{ membership.user.email }}</span>
                  </div>
                </div>
              </td>

              <!-- Role badge -->
              <td class="pm-td">
                <span
                  class="pm-role-badge"
                  :style="{
                    backgroundColor: getRoleConfig(membership.role).bg,
                    color: getRoleConfig(membership.role).color,
                    borderColor: getRoleConfig(membership.role).border,
                  }"
                >
                  {{ getRoleConfig(membership.role).label }}
                </span>
              </td>

              <!-- Joined date -->
              <td class="pm-td pm-td--date">
                {{ formatDate(membership.joined_at) }}
              </td>

              <!-- Actions (owner only, can't remove self if owner) -->
              <td class="pm-td pm-td--action">
                <div class="pm-row-actions">
                  <button
                    v-if="isOwner && membership.role !== 'owner'"
                    class="pm-remove-btn"
                    :disabled="removingIds.has(membership.id)"
                    :title="`Xóa @${membership.user.username} khỏi dự án`"
                    :aria-label="`Xóa @${membership.user.username}`"
                    @click="handleRemoveMember(membership)"
                  >
                    <span
                      v-if="removingIds.has(membership.id)"
                      class="pm-remove-btn__spinner"
                      aria-hidden="true"
                    ></span>
                    <el-icon v-else :size="15"><Delete /></el-icon>
                    <span class="pm-remove-btn__label">Xóa</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Add member drawer ─────────────────────────────────────────────── -->
    <el-drawer
      v-model="showAddDrawer"
      title="Thêm thành viên"
      direction="rtl"
      size="400px"
      :close-on-click-modal="true"
      destroy-on-close
    >
      <div class="pm-drawer">
        <!-- Intro -->
        <div class="pm-drawer__intro">
          <div class="pm-drawer__icon-wrap" aria-hidden="true">
            <el-icon :size="28" color="#004ac6"><UserFilled /></el-icon>
          </div>
          <p class="pm-drawer__desc">
            Tìm kiếm người dùng theo tên đăng nhập hoặc email để thêm vào dự án
            <strong>{{ currentProject?.name }}</strong
            >.
          </p>
        </div>

        <!-- Search input -->
        <div class="pm-drawer__search">
          <el-icon class="pm-drawer__search-icon" :size="16"><Search /></el-icon>
          <input
            v-model="searchQuery"
            class="pm-drawer__search-input"
            type="text"
            placeholder="Tìm theo username hoặc email..."
            aria-label="Tìm kiếm người dùng"
            @input="onSearchInput"
          />
        </div>

        <!-- Hint -->
        <p
          v-if="searchQuery.trim().length > 0 && searchQuery.trim().length < 2"
          class="pm-drawer__hint"
        >
          Nhập ít nhất 2 ký tự để tìm kiếm.
        </p>

        <!-- Loading -->
        <div v-else-if="isSearching" class="pm-drawer__state">
          <span class="pm-drawer__spinner" aria-hidden="true"></span>
          Đang tìm kiếm...
        </div>

        <!-- No results -->
        <div
          v-else-if="!isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0"
          class="pm-drawer__state"
        >
          Không tìm thấy người dùng phù hợp.
        </div>

        <!-- Results -->
        <ul v-else-if="searchResults.length > 0" class="pm-search-results">
          <li v-for="user in searchResults" :key="user.id" class="pm-search-result">
            <div class="pm-search-result__info">
              <div class="pm-avatar pm-avatar--sm">
                <img
                  v-if="user.avatar_url"
                  :src="user.avatar_url"
                  :alt="user.username"
                  class="pm-avatar__img"
                />
                <span v-else class="pm-avatar__initials">{{ getInitials(user) }}</span>
              </div>
              <div>
                <p class="pm-search-result__name">
                  {{ user.full_name || user.username }}
                </p>
                <p class="pm-search-result__sub">@{{ user.username }} · {{ user.email }}</p>
              </div>
            </div>

            <!-- Already added badge -->
            <span v-if="addedUserIds.has(user.id)" class="pm-added-badge">
              <el-icon :size="13"><CircleCheck /></el-icon>
              Đã thêm
            </span>

            <!-- Add button -->
            <button
              v-else
              class="pm-btn pm-btn--primary pm-btn--sm"
              :disabled="addingUserId === user.id"
              @click="handleAddMember(user)"
            >
              <span
                v-if="addingUserId === user.id"
                class="pm-btn__spinner"
                aria-hidden="true"
              ></span>
              <el-icon v-else :size="13"><Plus /></el-icon>
              {{ addingUserId === user.id ? 'Đang thêm...' : 'Thêm' }}
            </button>
          </li>
        </ul>

        <!-- Idle state -->
        <div v-else class="pm-drawer__idle">
          <el-icon :size="40" color="#c3c6d7"><Search /></el-icon>
          <p>Nhập tên hoặc email để tìm kiếm</p>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
/* ── Design tokens ───────────────────────────────────────────────────────────── */
.pm-page {
  --primary: #004ac6;
  --primary-container: #2563eb;
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
}

.pm-page {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 48px;
}

/* ── Header ──────────────────────────────────────────────────────────────────── */
.pm-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.pm-breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.pm-breadcrumb__link {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-size: 13px;
  color: var(--outline);
  transition: color 0.15s;
  font-family: inherit;
}

.pm-breadcrumb__link:hover {
  color: var(--primary);
}

.pm-breadcrumb__sep {
  font-size: 13px;
  color: var(--outline-variant);
}

.pm-breadcrumb__current {
  font-size: 13px;
  font-weight: 700;
  color: var(--primary);
}

.pm-header__title {
  font-size: 24px;
  font-weight: 600;
  line-height: 32px;
  letter-spacing: -0.02em;
  color: var(--on-surface);
  margin: 0 0 4px;
}

.pm-header__subtitle {
  font-size: 14px;
  color: var(--on-surface-variant);
  margin: 0;
}

.pm-header__actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

/* ── Buttons ─────────────────────────────────────────────────────────────────── */
.pm-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 0.15s,
    transform 0.1s;
  border: none;
  white-space: nowrap;
}

.pm-btn:active {
  transform: scale(0.97);
}
.pm-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.pm-btn--primary {
  background: var(--primary);
  color: #fff;
  box-shadow: 0 1px 4px rgba(0, 74, 198, 0.25);
}

.pm-btn--primary:hover:not(:disabled) {
  background: var(--primary-container);
}

.pm-btn--outline {
  background: var(--surface-lowest);
  border: 1px solid var(--border-subtle);
  color: var(--on-surface-variant);
}

.pm-btn--outline:hover {
  background: var(--surface-container-low);
}

.pm-btn--sm {
  padding: 5px 12px;
  font-size: 12px;
}

.pm-btn__spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Stats ───────────────────────────────────────────────────────────────────── */
.pm-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.pm-stat-card {
  background: var(--surface-lowest);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.pm-stat-card--accent {
  background: rgba(0, 74, 198, 0.04);
  border-color: rgba(0, 74, 198, 0.15);
}

.pm-stat-card__label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--outline);
}

.pm-stat-card__value {
  font-size: 28px;
  font-weight: 700;
  color: var(--on-surface);
  line-height: 1;
}

.pm-stat-card__value--name {
  font-size: 20px;
  color: var(--primary);
}

.pm-stat-card__value-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

/* ── Error ───────────────────────────────────────────────────────────────────── */
.pm-error {
  border-radius: 8px;
}

/* ── Table card ──────────────────────────────────────────────────────────────── */
.pm-table-card {
  background: var(--surface-lowest);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.pm-table-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-subtle);
  background: rgba(237, 237, 249, 0.3);
}

.pm-table-toolbar__count {
  font-size: 13px;
  color: var(--outline);
}

.pm-table-wrap {
  overflow-x: auto;
}

.pm-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.pm-thead-row {
  background: var(--surface-container-low);
  border-bottom: 1px solid var(--border-subtle);
}

.pm-th {
  padding: 14px 20px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--outline);
  white-space: nowrap;
}

.pm-th--action {
  width: 120px;
}

.pm-row {
  border-bottom: 1px solid var(--border-subtle);
  transition: background-color 0.12s;
}

.pm-row:last-child {
  border-bottom: none;
}
.pm-row:hover {
  background: rgba(0, 74, 198, 0.02);
}

.pm-td {
  padding: 14px 20px;
  vertical-align: middle;
}

.pm-td--date {
  font-size: 13px;
  color: var(--on-surface-variant);
  white-space: nowrap;
}

.pm-td--action {
  text-align: right;
  white-space: nowrap;
}

/* ── Row actions wrapper ─────────────────────────────────────────────────────── */
.pm-row-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

/* ── Member cell ─────────────────────────────────────────────────────────────── */
.pm-member-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pm-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-subtle);
}

.pm-avatar--sm {
  width: 32px;
  height: 32px;
}

.pm-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pm-avatar__initials {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
}

.pm-member-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.pm-member-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--on-surface);
  line-height: 20px;
}

.pm-member-username {
  font-size: 12px;
  color: var(--outline);
}

.pm-member-email {
  font-size: 12px;
  color: var(--outline-variant);
}

/* ── Role badge ──────────────────────────────────────────────────────────────── */
.pm-role-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border: 1px solid transparent;
  white-space: nowrap;
}

/* ── Remove button ───────────────────────────────────────────────────────────── */
.pm-remove-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background: none;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  color: var(--outline);
  transition:
    background-color 0.15s,
    color 0.15s,
    border-color 0.15s;
  white-space: nowrap;
}

.pm-remove-btn:hover:not(:disabled) {
  background: #fff0f0;
  color: var(--error);
  border-color: rgba(186, 26, 26, 0.25);
}

.pm-remove-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pm-remove-btn__label {
  /* shown inline next to the icon */
}

.pm-remove-btn__spinner {
  width: 13px;
  height: 13px;
  border: 2px solid rgba(186, 26, 26, 0.3);
  border-top-color: var(--error);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

/* ── "Đã thêm" badge in drawer ───────────────────────────────────────────────── */
.pm-added-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  color: #16a34a;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ── Empty ───────────────────────────────────────────────────────────────────── */
.pm-empty {
  padding: 48px;
  text-align: center;
  font-size: 14px;
  color: var(--outline);
}

/* ── Drawer ──────────────────────────────────────────────────────────────────── */
.pm-drawer {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

.pm-drawer__intro {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  padding: 8px 0;
}

.pm-drawer__icon-wrap {
  width: 56px;
  height: 56px;
  background: rgba(0, 74, 198, 0.08);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pm-drawer__desc {
  font-size: 13px;
  color: var(--on-surface-variant);
  margin: 0;
  line-height: 18px;
}

/* Search input */
.pm-drawer__search {
  position: relative;
}

.pm-drawer__search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--outline);
  pointer-events: none;
}

.pm-drawer__search-input {
  width: 100%;
  padding: 10px 14px 10px 38px;
  background: var(--surface-container-low);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  color: var(--on-surface);
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  box-sizing: border-box;
}

.pm-drawer__search-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(0, 74, 198, 0.12);
  background: var(--surface-lowest);
}

.pm-drawer__hint {
  font-size: 12px;
  color: var(--outline);
  margin: 0;
  text-align: center;
}

.pm-drawer__state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  font-size: 13px;
  color: var(--outline);
}

.pm-drawer__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--outline-variant);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.pm-drawer__idle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px;
  color: var(--outline);
  font-size: 13px;
  text-align: center;
}

/* Search results */
.pm-search-results {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.pm-search-result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  transition: background-color 0.12s;
}

.pm-search-result:hover {
  background: var(--surface-container-low);
}

.pm-search-result__info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.pm-search-result__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--on-surface);
  margin: 0;
  line-height: 18px;
}

.pm-search-result__sub {
  font-size: 12px;
  color: var(--outline);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Responsive ──────────────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .pm-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .pm-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .pm-stats {
    grid-template-columns: 1fr 1fr;
  }
  .pm-th--date,
  .pm-td--date {
    display: none;
  }
}
</style>
