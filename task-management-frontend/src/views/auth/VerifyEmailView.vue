<template>
  <div class="verify-page">
    <!-- Background blobs -->
    <div class="bg-blob bg-blob--tl" aria-hidden="true"></div>
    <div class="bg-blob bg-blob--br" aria-hidden="true"></div>

    <main class="verify-main">
      <div class="verify-container">
        <!-- Brand -->
        <div class="verify-brand">
          <div class="brand-mark" aria-hidden="true">
            <el-icon :size="26" color="#ffffff"><Check /></el-icon>
          </div>
          <h1 class="verify-title">TaskFlow</h1>
        </div>

        <!-- Card -->
        <div class="verify-card">
          <!-- Loading state -->
          <template v-if="status === 'loading'">
            <div class="status-icon-wrap status-icon-wrap--loading" aria-hidden="true">
              <el-icon :size="40" class="spin"><Loading /></el-icon>
            </div>
            <h2 class="card-title">Đang xác thực email...</h2>
            <p class="card-desc">Vui lòng chờ trong giây lát.</p>
          </template>

          <!-- Success state -->
          <template v-else-if="status === 'success'">
            <div class="status-icon-wrap status-icon-wrap--success" aria-hidden="true">
              <el-icon :size="40" color="#15803d"><CircleCheckFilled /></el-icon>
            </div>
            <h2 class="card-title">Xác thực thành công!</h2>
            <p class="card-desc">
              Email của bạn đã được xác thực. Bạn có thể đăng nhập và bắt đầu sử dụng TaskFlow ngay bây giờ.
            </p>
            <router-link to="/login" class="btn-primary">
              Đăng nhập ngay
              <el-icon><ArrowRight /></el-icon>
            </router-link>
          </template>

          <!-- Error state -->
          <template v-else-if="status === 'error'">
            <div class="status-icon-wrap status-icon-wrap--error" aria-hidden="true">
              <el-icon :size="40" color="#ba1a1a"><CircleCloseFilled /></el-icon>
            </div>
            <h2 class="card-title">Xác thực thất bại</h2>
            <p class="card-desc">{{ errorMessage }}</p>
            <div class="card-actions">
              <router-link to="/login" class="btn-secondary">
                <el-icon><ArrowLeft /></el-icon>
                Quay lại đăng nhập
              </router-link>
            </div>
          </template>

          <!-- No token state -->
          <template v-else-if="status === 'no-token'">
            <div class="status-icon-wrap status-icon-wrap--error" aria-hidden="true">
              <el-icon :size="40" color="#ba1a1a"><CircleCloseFilled /></el-icon>
            </div>
            <h2 class="card-title">Liên kết không hợp lệ</h2>
            <p class="card-desc">
              Liên kết xác thực không hợp lệ hoặc đã hết hạn. Vui lòng đăng ký lại hoặc liên hệ hỗ trợ.
            </p>
            <div class="card-actions">
              <router-link to="/register" class="btn-primary">
                Đăng ký lại
              </router-link>
              <router-link to="/login" class="btn-secondary">
                <el-icon><ArrowLeft /></el-icon>
                Quay lại đăng nhập
              </router-link>
            </div>
          </template>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import apiClient from '@/services/apiClient'
import {
  Check,
  Loading,
  CircleCheckFilled,
  CircleCloseFilled,
  ArrowRight,
  ArrowLeft,
} from '@element-plus/icons-vue'

const route = useRoute()

// 'loading' | 'success' | 'error' | 'no-token'
const status = ref('loading')
const errorMessage = ref('')

onMounted(async () => {
  const token = route.query.token

  if (!token) {
    status.value = 'no-token'
    return
  }

  try {
    await apiClient.get(`/api/auth/verify-email/?token=${token}`)
    status.value = 'success'
  } catch (err) {
    status.value = 'error'
    errorMessage.value =
      err.message ||
      'Token xác thực không hợp lệ hoặc đã hết hạn. Vui lòng đăng ký lại.'
  }
})
</script>

<style scoped>
/* ── Design tokens ───────────────────────────────────────────────────────────── */
.verify-page {
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
  --success-bg: rgba(21, 128, 61, 0.08);
  --error-bg: rgba(186, 26, 26, 0.08);
  --loading-bg: rgba(0, 74, 198, 0.08);
}

/* ── Page shell ──────────────────────────────────────────────────────────────── */
.verify-page {
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

/* ── Main ────────────────────────────────────────────────────────────────────── */
.verify-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  position: relative;
  z-index: 1;
}

.verify-container {
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── Brand ───────────────────────────────────────────────────────────────────── */
.verify-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
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
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 74, 198, 0.3);
}

.verify-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--on-surface);
  margin: 0;
}

/* ── Card ────────────────────────────────────────────────────────────────────── */
.verify-card {
  width: 100%;
  background: var(--surface-container-lowest);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 40px 32px 32px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* ── Status icon ─────────────────────────────────────────────────────────────── */
.status-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.status-icon-wrap--loading {
  background: var(--loading-bg);
  color: var(--primary);
}

.status-icon-wrap--success {
  background: var(--success-bg);
}

.status-icon-wrap--error {
  background: var(--error-bg);
}

/* Spinning animation for loading icon */
.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* ── Card text ───────────────────────────────────────────────────────────────── */
.card-title {
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
  letter-spacing: -0.01em;
  color: var(--on-surface);
  margin: 0 0 12px;
}

.card-desc {
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  color: var(--on-surface-variant);
  margin: 0 0 28px;
  max-width: 340px;
}

/* ── Buttons ─────────────────────────────────────────────────────────────────── */
.card-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 44px;
  background: var(--primary);
  border: 1px solid var(--primary);
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  text-decoration: none;
  transition: background-color 0.15s;
}

.btn-primary:hover {
  background: var(--primary-container);
  border-color: var(--primary-container);
}

.btn-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 44px;
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--on-surface-variant);
  text-decoration: none;
  transition: background-color 0.15s, border-color 0.15s;
}

.btn-secondary:hover {
  background: var(--surface-container-low);
  border-color: var(--outline);
  color: var(--on-surface);
}

/* ── Responsive ──────────────────────────────────────────────────────────────── */
@media (max-width: 480px) {
  .verify-card {
    padding: 32px 20px 24px;
  }

  .card-title {
    font-size: 18px;
  }
}
</style>
