<template>
  <div class="login-page">
    <!-- ── Background accent blobs ──────────────────────────────────────── -->
    <div class="bg-blob bg-blob--tl" aria-hidden="true"></div>
    <div class="bg-blob bg-blob--br" aria-hidden="true"></div>

    <main class="login-main">
      <div class="login-container">
        <!-- Brand -->
        <div class="login-brand">
          <div class="brand-mark" aria-hidden="true">
            <el-icon :size="26" color="#ffffff"><Check /></el-icon>
          </div>
          <h1 class="login-title">Welcome Back</h1>
          <p class="login-subtitle">
            Đăng nhập vào TaskFlow để quản lý dự án và cộng tác với nhóm của bạn.
          </p>
        </div>

        <!-- Card -->
        <div class="login-card">
          <el-form
            ref="formRef"
            :model="formData"
            :rules="formRules"
            label-position="top"
            size="large"
            class="login-form"
            @submit.prevent="handleSubmit"
          >
            <!-- Username -->
            <el-form-item label="Tên đăng nhập" prop="username" class="form-item">
              <el-input
                v-model="formData.username"
                placeholder="Nhập tên đăng nhập"
                :prefix-icon="UserIcon"
                autocomplete="username"
                :disabled="authStore.isLoading"
                clearable
              />
            </el-form-item>

            <!-- Password -->
            <el-form-item prop="password" class="form-item">
              <template #label>
                <div class="password-label-row">
                  <span class="password-label-text">Mật khẩu</span>
                  <a href="#" class="forgot-link">Quên mật khẩu?</a>
                </div>
              </template>
              <el-input
                v-model="formData.password"
                type="password"
                placeholder="••••••••"
                :prefix-icon="LockIcon"
                show-password
                autocomplete="current-password"
                :disabled="authStore.isLoading"
              />
            </el-form-item>

            <!-- Remember me -->
            <div class="remember-row">
              <el-checkbox v-model="rememberMe" class="remember-checkbox">
                Ghi nhớ đăng nhập trong 30 ngày
              </el-checkbox>
            </div>

            <!-- API error -->
            <el-alert
              v-if="authStore.error"
              :title="authStore.error"
              type="error"
              show-icon
              :closable="false"
              class="api-error"
            >
              <template v-if="isEmailUnverifiedError" #default>
                <p class="api-error__detail">{{ authStore.error }}</p>
                <p class="api-error__hint">
                  Chưa nhận được email?
                  <router-link to="/verify-email/pending" class="api-error__link">
                    Xem hướng dẫn xác thực
                  </router-link>
                </p>
              </template>
            </el-alert>

            <!-- Submit -->
            <el-button
              type="primary"
              native-type="submit"
              :loading="authStore.isLoading"
              :disabled="authStore.isLoading"
              class="submit-btn"
              size="large"
            >
              {{ authStore.isLoading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
            </el-button>
          </el-form>

          <!-- Divider -->
          <div class="divider" aria-hidden="true">
            <div class="divider__line"></div>
            <span class="divider__text">Hoặc tiếp tục với</span>
            <div class="divider__line"></div>
          </div>

          <!-- Social buttons -->
          <div class="social-grid">
            <button type="button" class="social-btn" aria-label="Đăng nhập với Google">
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt=""
                class="social-btn__img"
                aria-hidden="true"
              />
              <span class="social-btn__label">Google</span>
            </button>
            <button type="button" class="social-btn" aria-label="Đăng nhập với SSO">
              <el-icon class="social-btn__icon"><Monitor /></el-icon>
              <span class="social-btn__label">SSO</span>
            </button>
          </div>
        </div>

        <!-- Register prompt -->
        <p class="register-prompt">
          Chưa có tài khoản?
          <router-link to="/register" class="register-link">Tạo tài khoản</router-link>
        </p>
      </div>
    </main>

    <!-- ── Page footer ──────────────────────────────────────────────────── -->
    <footer class="page-footer">
      <p class="page-footer__copy">© 2024 TaskFlow Enterprise Workspace. All rights reserved.</p>
      <nav class="page-footer__links" aria-label="Footer">
        <a href="#" class="page-footer__link">Chính sách bảo mật</a>
        <a href="#" class="page-footer__link">Điều khoản dịch vụ</a>
        <a href="#" class="page-footer__link">Hỗ trợ</a>
      </nav>
    </footer>

    <!-- ── Enterprise tip (desktop only) ───────────────────────────────── -->
    <aside class="enterprise-tip" aria-label="Enterprise tip">
      <div class="enterprise-tip__icon-wrap" aria-hidden="true">
        <el-icon :size="22" color="#004ac6"><Opportunity /></el-icon>
      </div>
      <div>
        <p class="enterprise-tip__title">Enterprise Tip</p>
        <p class="enterprise-tip__body">
          Sử dụng xác thực đa yếu tố để bảo vệ dữ liệu dự án của bạn an toàn và tuân thủ.
        </p>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  User as UserIcon,
  Lock as LockIcon,
  Check,
  Monitor,
  Opportunity,
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// ── Template ref ──────────────────────────────────────────────────────────────
const formRef = ref(null)

// ── Form state ────────────────────────────────────────────────────────────────
const formData = reactive({
  username: '',
  password: '',
})

const rememberMe = ref(false)

// Detect email-not-verified error to show extra hint
const isEmailUnverifiedError = computed(() =>
  authStore.error?.includes('chưa được xác thực') ?? false,
)

// ── Validation rules ──────────────────────────────────────────────────────────
const formRules = {
  username: [{ required: true, message: 'Tên đăng nhập không được để trống', trigger: 'blur' }],
  password: [{ required: true, message: 'Mật khẩu không được để trống', trigger: 'blur' }],
}

/**
 * Handle form submission — validate via ElForm then call auth store login.
 */
const handleSubmit = async () => {
  const isValid = await formRef.value?.validate().catch(() => false)
  if (!isValid) return

  await authStore.login({
    username: formData.username,
    password: formData.password,
  })

  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  }
}
</script>

<style scoped>
/* ── Design tokens (DESIGN.md) ───────────────────────────────────────────────── */
.login-page {
  --primary: #004ac6;
  --primary-container: #2563eb;
  --surface: #faf8ff;
  --surface-container: #ededf9;
  --surface-container-lowest: #ffffff;
  --surface-container-low: #f3f3fe;
  --on-surface: #191b23;
  --on-surface-variant: #434655;
  --outline: #737686;
  --outline-variant: #c3c6d7;
  --border-subtle: #e2e8f0;
  --error: #ba1a1a;
  --error-container: #ffdad6;
}

/* ── Page shell ──────────────────────────────────────────────────────────────── */
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--surface);
  position: relative;
  overflow: hidden;
}

/* ── Background blobs ────────────────────────────────────────────────────────── */
.bg-blob {
  position: absolute;
  width: 40%;
  height: 40%;
  border-radius: 50%;
  pointer-events: none;
  opacity: 0.5;
}

.bg-blob--tl {
  top: -10%;
  left: -10%;
  background: rgba(0, 74, 198, 0.05);
  filter: blur(120px);
}

.bg-blob--br {
  bottom: -10%;
  right: -10%;
  background: rgba(80, 95, 118, 0.05);
  filter: blur(120px);
}

/* ── Main content ────────────────────────────────────────────────────────────── */
.login-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  position: relative;
  z-index: 1;
}

.login-container {
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── Brand ───────────────────────────────────────────────────────────────────── */
.login-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 40px;
}

.brand-mark {
  width: 48px;
  height: 48px;
  background-color: var(--primary);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 74, 198, 0.3);
}

.login-title {
  /* h1 — DESIGN.md */
  font-size: 24px;
  font-weight: 600;
  line-height: 32px;
  letter-spacing: -0.02em;
  color: var(--on-surface);
  margin: 0 0 8px;
}

.login-subtitle {
  /* body-base — DESIGN.md */
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: var(--on-surface-variant);
  margin: 0;
  max-width: 360px;
}

/* ── Card ────────────────────────────────────────────────────────────────────── */
.login-card {
  width: 100%;
  background: var(--surface-container-lowest);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

/* ── Form ────────────────────────────────────────────────────────────────────── */
.login-form {
  display: flex;
  flex-direction: column;
}

/* label-caps token — DESIGN.md */
.login-form :deep(.el-form-item__label) {
  font-size: 11px;
  font-weight: 700;
  line-height: 16px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--on-surface-variant);
  padding-bottom: 6px;
  width: 100%;
}

.form-item {
  margin-bottom: 20px;
}

/* Input border radius */
.login-form :deep(.el-input__wrapper) {
  border-radius: 8px;
}

/* ── Password label row (label + forgot link) ────────────────────────────────── */
.password-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.password-label-text {
  /* label-caps — DESIGN.md */
  font-size: 11px;
  font-weight: 700;
  line-height: 16px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--on-surface-variant);
}

.forgot-link {
  /* body-sm — DESIGN.md */
  font-size: 13px;
  font-weight: 400;
  line-height: 18px;
  color: var(--primary);
  text-decoration: none;
}

.forgot-link:hover {
  text-decoration: underline;
}

/* ── Remember me ─────────────────────────────────────────────────────────────── */
.remember-row {
  margin-bottom: 20px;
}

.remember-checkbox :deep(.el-checkbox__label) {
  /* body-sm — DESIGN.md */
  font-size: 13px;
  font-weight: 400;
  line-height: 18px;
  color: var(--on-surface-variant);
}

.remember-checkbox :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: var(--primary);
  border-color: var(--primary);
}

/* ── API error ───────────────────────────────────────────────────────────────── */
.api-error {
  margin-bottom: 16px;
  border-radius: 8px;
}

.api-error__detail {
  font-size: 13px;
  font-weight: 400;
  line-height: 18px;
  margin: 0 0 6px;
  color: var(--error);
}

.api-error__hint {
  font-size: 13px;
  font-weight: 400;
  line-height: 18px;
  margin: 0;
  color: var(--on-surface-variant);
}

.api-error__link {
  color: var(--primary);
  font-weight: 600;
  text-decoration: none;
}

.api-error__link:hover {
  text-decoration: underline;
}

/* ── Submit button ───────────────────────────────────────────────────────────── */
.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 8px;
  --el-button-bg-color: var(--primary);
  --el-button-border-color: var(--primary);
  --el-button-hover-bg-color: var(--primary-container);
  --el-button-hover-border-color: var(--primary-container);
  --el-button-active-bg-color: var(--primary);
}

/* ── Divider ─────────────────────────────────────────────────────────────────── */
.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0 20px;
}

.divider__line {
  flex: 1;
  height: 1px;
  background: var(--outline-variant);
}

.divider__text {
  /* label-caps — DESIGN.md */
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--outline);
  white-space: nowrap;
}

/* ── Social buttons ──────────────────────────────────────────────────────────── */
.social-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.social-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s;
  font-family: inherit;
}

.social-btn:hover {
  background: var(--surface-container-low);
}

.social-btn__img {
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.social-btn__icon {
  font-size: 18px;
  color: var(--on-surface);
}

.social-btn__label {
  /* body-sm semibold — DESIGN.md */
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
  color: var(--on-surface-variant);
}

/* ── Register prompt ─────────────────────────────────────────────────────────── */
.register-prompt {
  margin-top: 28px;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: var(--on-surface-variant);
  text-align: center;
}

.register-link {
  color: var(--primary);
  font-weight: 600;
  text-decoration: none;
  margin-left: 4px;
}

.register-link:hover {
  text-decoration: underline;
}

/* ── Page footer ─────────────────────────────────────────────────────────────── */
.page-footer {
  padding: 20px 24px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.page-footer__copy {
  /* body-sm — DESIGN.md */
  font-size: 13px;
  font-weight: 400;
  line-height: 18px;
  color: var(--outline);
  margin: 0;
  text-align: center;
}

.page-footer__links {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
}

.page-footer__link {
  font-size: 13px;
  font-weight: 400;
  line-height: 18px;
  color: var(--outline);
  text-decoration: none;
  transition: color 0.15s;
}

.page-footer__link:hover {
  color: var(--primary);
}

/* ── Enterprise tip (desktop only) ──────────────────────────────────────────── */
.enterprise-tip {
  position: fixed;
  bottom: 32px;
  left: 32px;
  display: none;
  align-items: flex-start;
  gap: 12px;
  background: var(--surface-container);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 16px;
  max-width: 280px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  z-index: 10;
}

.enterprise-tip__icon-wrap {
  background: rgba(0, 74, 198, 0.1);
  border-radius: 8px;
  padding: 8px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.enterprise-tip__title {
  /* h3 — DESIGN.md */
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: var(--on-surface);
  margin: 0 0 4px;
}

.enterprise-tip__body {
  /* body-sm — DESIGN.md */
  font-size: 13px;
  font-weight: 400;
  line-height: 18px;
  color: var(--on-surface-variant);
  margin: 0;
}

/* ── Responsive ──────────────────────────────────────────────────────────────── */
@media (min-width: 1024px) {
  .enterprise-tip {
    display: flex;
  }

  .page-footer {
    flex-direction: row;
    justify-content: space-between;
    padding: 20px 48px;
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 24px 20px;
  }

  .login-title {
    font-size: 20px;
  }

  .social-grid {
    grid-template-columns: 1fr;
  }
}
</style>
