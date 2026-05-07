<template>
  <div class="register-page">
    <!-- ── Left: form panel ──────────────────────────────────────────────── -->
    <main class="form-panel">
      <div class="form-panel__inner">
        <!-- Brand -->
        <div class="register-brand">
          <div class="brand-mark" aria-hidden="true">
            <el-icon :size="26" color="#ffffff"><Check /></el-icon>
          </div>
          <h1 class="register-title">TaskFlow</h1>
          <p class="register-subtitle">Tạo tài khoản workspace doanh nghiệp của bạn</p>
        </div>

        <!-- Card -->
        <div class="register-card">
          <el-form
            ref="formRef"
            :model="formData"
            :rules="formRules"
            label-position="top"
            size="large"
            class="register-form"
            @submit.prevent="handleSubmit"
          >
            <!-- Username -->
            <el-form-item label="Tên đăng nhập" prop="username" class="form-item">
              <el-input
                v-model="formData.username"
                placeholder="johndoe"
                :prefix-icon="UserIcon"
                autocomplete="username"
                :disabled="authStore.isLoading"
                clearable
              />
            </el-form-item>

            <!-- Email -->
            <el-form-item label="Địa chỉ Email" prop="email" class="form-item">
              <el-input
                v-model="formData.email"
                type="email"
                placeholder="john@company.com"
                :prefix-icon="MessageIcon"
                autocomplete="email"
                :disabled="authStore.isLoading"
                clearable
              />
            </el-form-item>

            <!-- Password -->
            <el-form-item label="Mật khẩu" prop="password" class="form-item">
              <el-input
                v-model="formData.password"
                type="password"
                placeholder="••••••••"
                :prefix-icon="LockIcon"
                show-password
                autocomplete="new-password"
                :disabled="authStore.isLoading"
              />
              <template #extra>
                <span class="field-hint">Tối thiểu 8 ký tự.</span>
              </template>
            </el-form-item>

            <!-- Confirm Password -->
            <el-form-item label="Xác nhận mật khẩu" prop="confirmPassword" class="form-item">
              <el-input
                v-model="formData.confirmPassword"
                type="password"
                placeholder="••••••••"
                :prefix-icon="LockIcon"
                show-password
                autocomplete="new-password"
                :disabled="authStore.isLoading"
              />
            </el-form-item>

            <!-- API error -->
            <el-alert
              v-if="authStore.error"
              :title="authStore.error"
              type="error"
              show-icon
              :closable="false"
              class="api-error"
            />

            <!-- Submit -->
            <el-button
              type="primary"
              native-type="submit"
              :loading="authStore.isLoading"
              :disabled="authStore.isLoading"
              class="submit-btn"
              size="large"
            >
              <span>{{ authStore.isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản' }}</span>
              <el-icon v-if="!authStore.isLoading" class="submit-btn__arrow"
                ><ArrowRight
              /></el-icon>
            </el-button>
          </el-form>

          <!-- Divider + login link -->
          <div class="card-footer">
            <p class="login-prompt">
              Đã có tài khoản?
              <router-link to="/login" class="login-link">Đăng nhập</router-link>
            </p>
          </div>
        </div>

        <!-- Legal links -->
        <div class="legal-links">
          <a href="#" class="legal-link">Chính sách bảo mật</a>
          <span class="legal-dot" aria-hidden="true"></span>
          <a href="#" class="legal-link">Điều khoản dịch vụ</a>
          <span class="legal-dot" aria-hidden="true"></span>
          <a href="#" class="legal-link">Trung tâm hỗ trợ</a>
        </div>
        <p class="legal-copy">© 2026 TASKFLOW ENTERPRISE SOLUTIONS</p>
      </div>
    </main>

    <!-- ── Right: decorative sidebar (desktop only) ──────────────────────── -->
    <aside class="deco-panel" aria-hidden="true">
      <div class="deco-panel__overlay"></div>
      <div class="deco-panel__content">
        <h2 class="deco-panel__headline">Streamline your workflow with surgical precision.</h2>
        <div class="deco-panel__social-proof">
          <div class="avatar-stack">
            <div class="avatar-placeholder">JD</div>
            <div class="avatar-placeholder">KL</div>
            <div class="avatar-placeholder">MR</div>
          </div>
          <p class="deco-panel__social-text">Được tin dùng bởi 12,000+ nhóm trên toàn thế giới</p>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  User as UserIcon,
  Lock as LockIcon,
  Message as MessageIcon,
  Check,
  ArrowRight,
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// ── Template ref ──────────────────────────────────────────────────────────────
const formRef = ref(null)

// ── Form state ────────────────────────────────────────────────────────────────
const formData = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

// ── Validation rules ──────────────────────────────────────────────────────────
const formRules = {
  username: [
    { required: true, message: 'Tên đăng nhập không được để trống', trigger: 'blur' },
    { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự', trigger: 'blur' },
    { max: 150, message: 'Tên đăng nhập không được vượt quá 150 ký tự', trigger: 'blur' },
    {
      pattern: /^[\w.@+-]+$/,
      message: 'Chỉ được chứa chữ cái, số và các ký tự . @ + - _',
      trigger: 'blur',
    },
  ],
  email: [
    { required: true, message: 'Email không được để trống', trigger: 'blur' },
    { type: 'email', message: 'Địa chỉ email không hợp lệ', trigger: 'blur' },
  ],
  password: [
    { required: true, message: 'Mật khẩu không được để trống', trigger: 'blur' },
    { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: 'Vui lòng xác nhận mật khẩu', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== formData.password) {
          callback(new Error('Mật khẩu xác nhận không khớp'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

/**
 * Handle form submission — validate via ElForm then call auth store register.
 */
const handleSubmit = async () => {
  const isValid = await formRef.value?.validate().catch(() => false)
  if (!isValid) return

  const result = await authStore.register({
    username: formData.username,
    email: formData.email,
    password: formData.password,
    confirmPassword: formData.confirmPassword,
  })

  if (result?.success) {
    router.push({ name: 'verify-email-pending', query: { email: result.email } })
  }
}
</script>

<style scoped>
/* ── Design tokens (DESIGN.md) ───────────────────────────────────────────────── */
.register-page {
  --primary: #004ac6;
  --primary-container: #2563eb;
  --surface: #faf8ff;
  --surface-container-lowest: #ffffff;
  --surface-container-low: #f3f3fe;
  --on-surface: #191b23;
  --on-surface-variant: #434655;
  --outline: #737686;
  --outline-variant: #c3c6d7;
  --border-subtle: #e2e8f0;
  --error: #ba1a1a;
  --error-container: #ffdad6;
  --surface-sidebar: #0f172a;
}

/* ── Page shell: two-column on desktop ───────────────────────────────────────── */
.register-page {
  min-height: 100vh;
  display: flex;
  background-color: var(--surface);
}

/* ── Left form panel ─────────────────────────────────────────────────────────── */
.form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  overflow-y: auto;
}

.form-panel__inner {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── Brand ───────────────────────────────────────────────────────────────────── */
.register-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 32px;
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

.register-title {
  /* h1 — DESIGN.md */
  font-size: 24px;
  font-weight: 600;
  line-height: 32px;
  letter-spacing: -0.02em;
  color: var(--on-surface);
  margin: 0 0 6px;
}

.register-subtitle {
  /* body-base — DESIGN.md */
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: var(--on-surface-variant);
  margin: 0;
}

/* ── Card ────────────────────────────────────────────────────────────────────── */
.register-card {
  width: 100%;
  background: var(--surface-container-lowest);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
}

/* ── Form ────────────────────────────────────────────────────────────────────── */
.register-form {
  display: flex;
  flex-direction: column;
}

/* label-caps token — DESIGN.md */
.register-form :deep(.el-form-item__label) {
  font-size: 11px;
  font-weight: 700;
  line-height: 16px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--on-surface-variant);
  padding-bottom: 6px;
}

.form-item {
  margin-bottom: 20px;
}

/* Input border radius */
.register-form :deep(.el-input__wrapper) {
  border-radius: 8px;
}

/* Password hint below the field */
.field-hint {
  /* body-sm — DESIGN.md */
  font-size: 13px;
  font-weight: 400;
  line-height: 18px;
  color: var(--on-surface-variant);
  margin-top: 4px;
  display: block;
}

/* ── API error ───────────────────────────────────────────────────────────────── */
.api-error {
  margin-bottom: 16px;
  border-radius: 8px;
}

/* ── Submit button ───────────────────────────────────────────────────────────── */
.submit-btn {
  width: 100%;
  margin-top: 8px;
  height: 44px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  --el-button-bg-color: var(--primary);
  --el-button-border-color: var(--primary);
  --el-button-hover-bg-color: var(--primary-container);
  --el-button-hover-border-color: var(--primary-container);
  --el-button-active-bg-color: var(--primary);
}

.submit-btn__arrow {
  font-size: 16px;
}

/* ── Card footer: login link ─────────────────────────────────────────────────── */
.card-footer {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border-subtle);
  text-align: center;
}

.login-prompt {
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: var(--on-surface-variant);
  margin: 0;
}

.login-link {
  color: var(--primary);
  font-weight: 600;
  text-decoration: none;
  margin-left: 4px;
}

.login-link:hover {
  text-decoration: underline;
}

/* ── Legal links ─────────────────────────────────────────────────────────────── */
.legal-links {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 28px;
  flex-wrap: wrap;
  justify-content: center;
}

.legal-link {
  /* body-sm — DESIGN.md */
  font-size: 13px;
  font-weight: 400;
  line-height: 18px;
  color: var(--outline);
  text-decoration: none;
  transition: color 0.15s;
}

.legal-link:hover {
  color: var(--on-surface);
}

.legal-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--outline-variant);
  flex-shrink: 0;
}

.legal-copy {
  /* label-caps — DESIGN.md */
  font-size: 11px;
  font-weight: 700;
  line-height: 16px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--outline);
  margin: 12px 0 0;
  text-align: center;
}

/* ── Right decorative panel (desktop only) ───────────────────────────────────── */
.deco-panel {
  display: none;
  position: relative;
  width: 33.333%;
  background-color: var(--surface-sidebar);
  overflow: hidden;
  flex-shrink: 0;
}

/* Gradient overlay at the bottom */
.deco-panel__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, var(--surface-sidebar) 0%, transparent 60%);
  z-index: 1;
}

/* Decorative grid pattern */
.deco-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  z-index: 0;
}

.deco-panel__content {
  position: absolute;
  bottom: 48px;
  left: 48px;
  right: 48px;
  z-index: 2;
  color: #ffffff;
}

.deco-panel__headline {
  /* h1 scale, white */
  font-size: 28px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.02em;
  margin: 0 0 24px;
}

.deco-panel__social-proof {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-stack {
  display: flex;
}

.avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid var(--surface-sidebar);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.8);
  margin-left: -8px;
}

.avatar-placeholder:first-child {
  margin-left: 0;
}

.deco-panel__social-text {
  font-size: 13px;
  font-weight: 400;
  line-height: 18px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

/* ── Responsive ──────────────────────────────────────────────────────────────── */
@media (min-width: 1024px) {
  .deco-panel {
    display: block;
  }
}

@media (max-width: 480px) {
  .register-card {
    padding: 24px 20px;
  }

  .register-title {
    font-size: 20px;
  }
}
</style>
