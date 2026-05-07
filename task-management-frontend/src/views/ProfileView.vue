<script setup>
/**
 * ProfileView — trang hồ sơ cá nhân.
 *
 * Avatar: chọn file → preview ngay → upload POST /api/users/me/avatar/
 * Thông tin: full_name chỉnh sửa → PATCH /api/users/me/
 */
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Message,
  SwitchButton,
  Lock,
  User,
  Camera,
  CircleCheck,
  WarningFilled,
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// ── Avatar state ──────────────────────────────────────────────────────────────

const avatarInputRef = ref(null)
const avatarPreview = ref('') // data URL for immediate preview
const pendingAvatarFile = ref(null) // File object waiting to be uploaded
/** '' | 'pending' | 'uploading' | 'success' | 'error' */
const avatarStatus = ref('')
const avatarStatusMsg = ref('')

// ── Profile form state ────────────────────────────────────────────────────────

const formData = ref({ full_name: '' })
const isEditing = ref(false)

function syncFormFromStore() {
  formData.value.full_name = authStore.user?.full_name ?? ''
  avatarPreview.value = authStore.user?.avatar_url ?? ''
  pendingAvatarFile.value = null
  avatarStatus.value = ''
  avatarStatusMsg.value = ''
}

onMounted(async () => {
  await authStore.fetchProfile()
  syncFormFromStore()
})

// ── Computed helpers ──────────────────────────────────────────────────────────

const userInitials = computed(() => {
  const name = authStore.user?.full_name || authStore.user?.username || ''
  return name.slice(0, 2).toUpperCase() || 'U'
})

const joinedDate = computed(() => {
  const d = authStore.user?.created_at
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
})

// ── Avatar file picker ────────────────────────────────────────────────────────

function triggerAvatarPicker() {
  avatarInputRef.value?.click()
}

/**
 * Khi người dùng chọn file:
 * 1. Validate type + size
 * 2. Preview ngay bằng FileReader
 * 3. Đánh dấu trạng thái "pending" — chờ nhấn "Lưu ảnh"
 */
function handleAvatarFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    avatarStatus.value = 'error'
    avatarStatusMsg.value = 'Vui lòng chọn file ảnh (JPG, PNG, GIF, WebP).'
    event.target.value = ''
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    avatarStatus.value = 'error'
    avatarStatusMsg.value = 'Ảnh không được vượt quá 2 MB.'
    event.target.value = ''
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    avatarPreview.value = e.target.result
    pendingAvatarFile.value = file
    avatarStatus.value = 'pending'
    avatarStatusMsg.value = `Đã chọn: ${file.name} (${(file.size / 1024).toFixed(0)} KB)`
  }
  reader.readAsDataURL(file)
  event.target.value = ''
}

/** Upload ảnh lên server */
async function handleAvatarUpload() {
  if (!pendingAvatarFile.value) return

  avatarStatus.value = 'uploading'
  avatarStatusMsg.value = 'Đang tải ảnh lên...'

  const success = await authStore.uploadAvatar(pendingAvatarFile.value)

  if (success) {
    pendingAvatarFile.value = null
    avatarPreview.value = authStore.user?.avatar_url ?? avatarPreview.value
    avatarStatus.value = 'success'
    avatarStatusMsg.value = 'Ảnh đại diện đã được cập nhật thành công!'
    ElMessage.success('Ảnh đại diện đã được cập nhật!')
  } else {
    avatarStatus.value = 'error'
    avatarStatusMsg.value = authStore.error || 'Tải ảnh thất bại. Vui lòng thử lại.'
    ElMessage.error(avatarStatusMsg.value)
  }
}

/** Hủy ảnh đang chờ, khôi phục ảnh cũ */
function cancelAvatarChange() {
  pendingAvatarFile.value = null
  avatarPreview.value = authStore.user?.avatar_url ?? ''
  avatarStatus.value = ''
  avatarStatusMsg.value = ''
}

// ── Profile form handlers ─────────────────────────────────────────────────────

function startEdit() {
  syncFormFromStore()
  isEditing.value = true
}

function cancelEdit() {
  syncFormFromStore()
  isEditing.value = false
}

async function handleSave() {
  const success = await authStore.updateProfile({
    full_name: formData.value.full_name.trim(),
  })
  if (success) {
    ElMessage.success('Cập nhật thông tin thành công!')
    isEditing.value = false
  } else if (authStore.error) {
    ElMessage.error(authStore.error)
  }
}

function handleLogout() {
  authStore.logout()
}
</script>

<template>
  <div class="profile-page">
    <!-- ── Profile hero ──────────────────────────────────────────────────── -->
    <div class="profile-hero">
      <div class="profile-hero__banner" aria-hidden="true"></div>

      <div class="profile-hero__body">
        <!-- Avatar section -->
        <div class="profile-hero__avatar-wrap">
          <input
            ref="avatarInputRef"
            type="file"
            accept="image/*"
            class="profile-hero__file-input"
            aria-label="Chọn ảnh đại diện"
            @change="handleAvatarFileChange"
          />
          <img
            v-if="avatarPreview"
            :src="avatarPreview"
            :alt="authStore.user?.username"
            class="profile-hero__avatar"
          />
          <div v-else class="profile-hero__avatar profile-hero__avatar--placeholder">
            {{ userInitials }}
          </div>
          <button
            class="profile-hero__camera-btn"
            title="Thay đổi ảnh đại diện"
            aria-label="Thay đổi ảnh đại diện"
            @click="triggerAvatarPicker"
          >
            <el-icon :size="16"><Camera /></el-icon>
          </button>
        </div>

        <!-- Name + meta + avatar status -->
        <div class="profile-hero__info">
          <h2 class="profile-hero__name">
            {{ authStore.user?.full_name || authStore.user?.username || '—' }}
          </h2>
          <p class="profile-hero__meta">
            <span>@{{ authStore.user?.username }}</span>
            <span class="profile-hero__dot" aria-hidden="true">·</span>
            <span>Tham gia {{ joinedDate }}</span>
            <span v-if="authStore.user?.is_email_verified" class="profile-hero__verified"
              >✓ Đã xác thực</span
            >
          </p>

          <!-- Avatar status banner -->
          <div
            v-if="avatarStatus"
            class="avatar-status"
            :class="`avatar-status--${avatarStatus}`"
            role="status"
            aria-live="polite"
          >
            <el-icon v-if="avatarStatus === 'success'" :size="15"><CircleCheck /></el-icon>
            <el-icon v-else-if="avatarStatus === 'error'" :size="15"><WarningFilled /></el-icon>
            <span
              v-else-if="avatarStatus === 'uploading'"
              class="avatar-status__spinner"
              aria-hidden="true"
            ></span>
            <span class="avatar-status__msg">{{ avatarStatusMsg }}</span>
            <div v-if="avatarStatus === 'pending'" class="avatar-status__actions">
              <button
                class="avatar-action-btn avatar-action-btn--primary"
                :disabled="authStore.isLoading"
                @click="handleAvatarUpload"
              >
                Lưu ảnh
              </button>
              <button
                class="avatar-action-btn avatar-action-btn--ghost"
                @click="cancelAvatarChange"
              >
                Hủy
              </button>
            </div>
          </div>

          <!-- Hint when idle -->
          <p v-else class="avatar-hint">
            <el-icon :size="13"><Camera /></el-icon>
            Nhấn biểu tượng máy ảnh để thay đổi ảnh đại diện (JPG, PNG, tối đa 2 MB)
          </p>
        </div>

        <!-- Edit profile button -->
        <div class="profile-hero__actions">
          <button v-if="!isEditing" class="profile-btn profile-btn--primary" @click="startEdit">
            Chỉnh sửa hồ sơ
          </button>
        </div>
      </div>
    </div>

    <!-- ── Main grid ─────────────────────────────────────────────────────── -->
    <div class="profile-grid">
      <!-- Left column -->
      <div class="profile-grid__main">
        <!-- Personal information -->
        <section class="profile-card">
          <div class="profile-card__header">
            <h3 class="profile-card__title">Thông tin cá nhân</h3>
            <div v-if="isEditing" class="profile-card__header-actions">
              <button class="profile-btn profile-btn--ghost" @click="cancelEdit">Hủy</button>
              <button
                class="profile-btn profile-btn--primary"
                :disabled="authStore.isLoading"
                @click="handleSave"
              >
                <span
                  v-if="authStore.isLoading"
                  class="profile-btn__spinner"
                  aria-hidden="true"
                ></span>
                {{ authStore.isLoading ? 'Đang lưu...' : 'Lưu thay đổi' }}
              </button>
            </div>
          </div>

          <div class="profile-fields">
            <!-- Full name — editable -->
            <div class="profile-field">
              <label class="profile-field__label" for="full-name">Họ và tên</label>
              <div class="profile-field__input-wrap">
                <input
                  id="full-name"
                  v-model="formData.full_name"
                  class="profile-field__input"
                  :class="{ 'profile-field__input--editable': isEditing }"
                  type="text"
                  placeholder="Nhập họ và tên"
                  :readonly="!isEditing"
                />
                <el-icon v-if="!isEditing" class="profile-field__lock-icon" :size="15"
                  ><Lock
                /></el-icon>
              </div>
            </div>

            <!-- Email — readonly -->
            <div class="profile-field">
              <label class="profile-field__label" for="email">Địa chỉ Email</label>
              <div class="profile-field__input-wrap">
                <el-icon class="profile-field__prefix-icon" :size="16"><Message /></el-icon>
                <input
                  id="email"
                  class="profile-field__input profile-field__input--with-icon"
                  type="email"
                  :value="authStore.user?.email ?? ''"
                  readonly
                />
                <el-icon class="profile-field__lock-icon" :size="15"><Lock /></el-icon>
              </div>
              <p class="profile-field__hint">Email không thể thay đổi.</p>
            </div>

            <!-- Username — readonly -->
            <div class="profile-field">
              <label class="profile-field__label" for="username">Tên đăng nhập</label>
              <div class="profile-field__input-wrap">
                <el-icon class="profile-field__prefix-icon" :size="16"><User /></el-icon>
                <input
                  id="username"
                  class="profile-field__input profile-field__input--with-icon"
                  type="text"
                  :value="authStore.user?.username ?? ''"
                  readonly
                />
                <el-icon class="profile-field__lock-icon" :size="15"><Lock /></el-icon>
              </div>
              <p class="profile-field__hint">Tên đăng nhập không thể thay đổi.</p>
            </div>
          </div>

          <div v-if="authStore.error && isEditing" class="profile-error" role="alert">
            {{ authStore.error }}
          </div>
        </section>

        <!-- Activity -->
        <section class="profile-card">
          <div class="profile-card__header">
            <h3 class="profile-card__title">Hoạt động gần đây</h3>
          </div>
          <div class="profile-activity__empty">
            <p>Chưa có hoạt động nào được ghi nhận.</p>
          </div>
        </section>
      </div>

      <!-- Right column -->
      <div class="profile-grid__side">
        <!-- Account settings -->
        <section class="profile-card">
          <h3 class="profile-card__title" style="margin-bottom: 24px">Cài đặt tài khoản</h3>
          <div class="profile-settings">
            <div class="profile-setting-row">
              <div class="profile-setting-row__info">
                <el-icon class="profile-setting-row__icon" :size="20"><Message /></el-icon>
                <div>
                  <p class="profile-setting-row__name">Xác thực Email</p>
                  <p class="profile-setting-row__desc">
                    {{
                      authStore.user?.is_email_verified
                        ? 'Email đã được xác thực'
                        : 'Email chưa được xác thực'
                    }}
                  </p>
                </div>
              </div>
              <span
                class="profile-setting-row__status"
                :class="
                  authStore.user?.is_email_verified
                    ? 'profile-setting-row__status--ok'
                    : 'profile-setting-row__status--warn'
                "
              >
                {{ authStore.user?.is_email_verified ? 'Đã xác thực' : 'Chưa xác thực' }}
              </span>
            </div>

            <div class="profile-divider" aria-hidden="true"></div>

            <button class="profile-logout-btn" @click="handleLogout">
              <el-icon :size="16"><SwitchButton /></el-icon>
              Đăng xuất
            </button>
          </div>
        </section>

        <!-- Stats -->
        <section class="profile-stats-card">
          <h3 class="profile-stats-card__title">Thống kê</h3>
          <div class="profile-stats-card__body">
            <div class="profile-stat">
              <p class="profile-stat__label">Tài khoản tạo lúc</p>
              <p class="profile-stat__value">{{ joinedDate }}</p>
            </div>
            <div class="profile-stat">
              <p class="profile-stat__label">Trạng thái</p>
              <p class="profile-stat__value">Đang hoạt động</p>
            </div>
          </div>
          <div class="profile-stats-card__blob" aria-hidden="true"></div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Design tokens ───────────────────────────────────────────────────────────── */
.profile-page {
  --primary: #004ac6;
  --primary-container: #2563eb;
  --surface-lowest: #ffffff;
  --surface-container-low: #f3f3fe;
  --surface-container: #ededf9;
  --surface-container-high: #e7e7f3;
  --surface-sidebar: #0f172a;
  --on-surface: #191b23;
  --on-surface-variant: #434655;
  --outline: #737686;
  --outline-variant: #c3c6d7;
  --border-subtle: #e2e8f0;
  --error: #ba1a1a;
}

.profile-page {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 48px;
}

/* ── Hero ────────────────────────────────────────────────────────────────────── */
.profile-hero {
  background: var(--surface-lowest);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.profile-hero__banner {
  height: 120px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%);
}

.profile-hero__body {
  display: flex;
  align-items: flex-end;
  gap: 20px;
  padding: 0 32px 24px;
  flex-wrap: wrap;
}

/* ── Avatar ──────────────────────────────────────────────────────────────────── */
.profile-hero__avatar-wrap {
  margin-top: -48px;
  flex-shrink: 0;
  position: relative;
}

.profile-hero__file-input {
  display: none;
}

.profile-hero__avatar {
  width: 96px;
  height: 96px;
  border-radius: 12px;
  border: 4px solid var(--surface-lowest);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  object-fit: cover;
  display: block;
}

.profile-hero__avatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary);
  color: #fff;
  font-size: 28px;
  font-weight: 700;
}

.profile-hero__camera-btn {
  position: absolute;
  bottom: -6px;
  right: -6px;
  width: 30px;
  height: 30px;
  background: var(--surface-lowest);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--primary);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition:
    background-color 0.15s,
    transform 0.1s;
}

.profile-hero__camera-btn:hover {
  background: var(--surface-container-low);
  transform: scale(1.08);
}

/* ── Hero info ───────────────────────────────────────────────────────────────── */
.profile-hero__info {
  flex: 1;
  padding-bottom: 4px;
  min-width: 0;
}

.profile-hero__name {
  font-size: 24px;
  font-weight: 600;
  line-height: 32px;
  letter-spacing: -0.02em;
  color: var(--on-surface);
  margin: 0 0 4px;
}

.profile-hero__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 13px;
  color: var(--outline);
  margin: 0 0 8px;
}

.profile-hero__dot {
  color: var(--outline-variant);
}

.profile-hero__verified {
  font-size: 11px;
  font-weight: 700;
  color: #16a34a;
  background: #dcfce7;
  padding: 2px 8px;
  border-radius: 9999px;
}

.profile-hero__actions {
  flex-shrink: 0;
  padding-bottom: 4px;
}

/* ── Avatar hint ─────────────────────────────────────────────────────────────── */
.avatar-hint {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--outline);
  margin: 0;
}

/* ── Avatar status banner ────────────────────────────────────────────────────── */
.avatar-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  flex-wrap: wrap;
}

.avatar-status--pending {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
}
.avatar-status--uploading {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
}
.avatar-status--success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}
.avatar-status--error {
  background: #fff0f0;
  border: 1px solid rgba(186, 26, 26, 0.2);
  color: var(--error);
}

.avatar-status__msg {
  flex: 1;
  min-width: 0;
}

.avatar-status__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(30, 64, 175, 0.3);
  border-top-color: #1e40af;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

.avatar-status__actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.avatar-action-btn {
  padding: 4px 12px;
  border-radius: 6px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background-color 0.12s;
}

.avatar-action-btn--primary {
  background: var(--primary);
  color: #fff;
}

.avatar-action-btn--primary:hover:not(:disabled) {
  background: var(--primary-container);
}
.avatar-action-btn--primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.avatar-action-btn--ghost {
  background: rgba(0, 0, 0, 0.06);
  color: #92400e;
}

/* ── Grid ────────────────────────────────────────────────────────────────────── */
.profile-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
  align-items: flex-start;
}

.profile-grid__main,
.profile-grid__side {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ── Card ────────────────────────────────────────────────────────────────────── */
.profile-card {
  background: var(--surface-lowest);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.profile-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.profile-card__title {
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
  letter-spacing: -0.01em;
  color: var(--on-surface);
  margin: 0;
}

.profile-card__header-actions {
  display: flex;
  gap: 8px;
}

/* ── Buttons ─────────────────────────────────────────────────────────────────── */
.profile-btn {
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
}

.profile-btn:active {
  transform: scale(0.97);
}
.profile-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.profile-btn--primary {
  background: var(--primary);
  color: #fff;
  box-shadow: 0 1px 4px rgba(0, 74, 198, 0.25);
}

.profile-btn--primary:hover:not(:disabled) {
  background: var(--primary-container);
}

.profile-btn--ghost {
  background: var(--surface-container-low);
  color: var(--on-surface-variant);
  border: 1px solid var(--border-subtle);
}

.profile-btn--ghost:hover {
  background: var(--surface-container);
}

.profile-btn__spinner {
  width: 14px;
  height: 14px;
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

/* ── Fields ──────────────────────────────────────────────────────────────────── */
.profile-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.profile-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.profile-field__label {
  font-size: 11px;
  font-weight: 700;
  line-height: 16px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--outline);
}

.profile-field__input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.profile-field__prefix-icon {
  position: absolute;
  left: 12px;
  color: var(--outline);
  pointer-events: none;
  z-index: 1;
}

.profile-field__lock-icon {
  position: absolute;
  right: 10px;
  color: var(--outline);
  opacity: 0.5;
  pointer-events: none;
}

.profile-field__input {
  width: 100%;
  padding: 10px 36px 10px 14px;
  background: var(--surface-container-low);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  color: var(--on-surface);
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s,
    background-color 0.15s;
  box-sizing: border-box;
}

.profile-field__input--with-icon {
  padding-left: 36px;
}

.profile-field__input[readonly] {
  cursor: default;
  color: var(--on-surface-variant);
}

.profile-field__input--editable {
  background: var(--surface-lowest);
  border-color: var(--outline-variant);
  padding-right: 14px;
}

.profile-field__input--editable:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(0, 74, 198, 0.12);
}

.profile-field__hint {
  font-size: 12px;
  color: var(--outline);
  margin: 0;
}

/* ── Error ───────────────────────────────────────────────────────────────────── */
.profile-error {
  margin-top: 16px;
  padding: 10px 14px;
  background: #fff0f0;
  border: 1px solid rgba(186, 26, 26, 0.2);
  border-radius: 8px;
  font-size: 13px;
  color: var(--error);
}

/* ── Activity ────────────────────────────────────────────────────────────────── */
.profile-activity__empty {
  padding: 32px;
  text-align: center;
  font-size: 14px;
  color: var(--outline);
}

/* ── Settings ────────────────────────────────────────────────────────────────── */
.profile-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile-setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.profile-setting-row__info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.profile-setting-row__icon {
  flex-shrink: 0;
  color: var(--outline);
}

.profile-setting-row__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--on-surface);
  margin: 0;
  line-height: 20px;
}

.profile-setting-row__desc {
  font-size: 12px;
  color: var(--outline);
  margin: 0;
}

.profile-setting-row__status {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 3px 10px;
  border-radius: 9999px;
  white-space: nowrap;
}

.profile-setting-row__status--ok {
  background: #dcfce7;
  color: #16a34a;
}
.profile-setting-row__status--warn {
  background: #fef3c7;
  color: #d97706;
}

.profile-divider {
  height: 1px;
  background: var(--border-subtle);
}

.profile-logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px;
  background: none;
  border: 1px solid rgba(186, 26, 26, 0.2);
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  color: var(--error);
  cursor: pointer;
  transition: background-color 0.15s;
}

.profile-logout-btn:hover {
  background: #fff0f0;
}

/* ── Stats card ──────────────────────────────────────────────────────────────── */
.profile-stats-card {
  background: var(--surface-sidebar);
  border-radius: 12px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.profile-stats-card__title {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 20px;
}

.profile-stats-card__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.profile-stat__label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 4px;
}

.profile-stat__value {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.profile-stats-card__blob {
  position: absolute;
  right: -40px;
  bottom: -40px;
  width: 160px;
  height: 160px;
  background: rgba(0, 74, 198, 0.2);
  border-radius: 50%;
  filter: blur(40px);
  z-index: 0;
}

/* ── Responsive ──────────────────────────────────────────────────────────────── */
@media (max-width: 1024px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .profile-hero__body {
    padding: 0 16px 20px;
  }
  .profile-fields {
    grid-template-columns: 1fr;
  }
  .profile-hero__name {
    font-size: 20px;
  }
}
</style>
