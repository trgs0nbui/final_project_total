<template>
  <div class="pending-page">
    <!-- Background blobs -->
    <div class="bg-blob bg-blob--tl" aria-hidden="true"></div>
    <div class="bg-blob bg-blob--br" aria-hidden="true"></div>

    <main class="pending-main">
      <div class="pending-container">
        <!-- Brand -->
        <div class="pending-brand">
          <div class="brand-mark" aria-hidden="true">
            <el-icon :size="26" color="#ffffff"><Check /></el-icon>
          </div>
          <h1 class="pending-title">TaskFlow</h1>
        </div>

        <!-- Card -->
        <div class="pending-card">
          <!-- Email icon -->
          <div class="email-icon-wrap" aria-hidden="true">
            <el-icon :size="40" color="#004ac6"><Message /></el-icon>
          </div>

          <h2 class="card-title">Kiểm tra hộp thư của bạn</h2>
          <p class="card-desc">
            Chúng tôi đã gửi email xác thực đến
            <strong class="email-highlight">{{ displayEmail }}</strong>.
            Vui lòng nhấp vào liên kết trong email để kích hoạt tài khoản.
          </p>

          <!-- Steps -->
          <ol class="steps-list" aria-label="Các bước xác thực">
            <li class="step-item">
              <span class="step-num" aria-hidden="true">1</span>
              <span>Mở email từ <strong>TaskFlow</strong> trong hộp thư đến</span>
            </li>
            <li class="step-item">
              <span class="step-num" aria-hidden="true">2</span>
              <span>Nhấp vào nút <strong>"Xác thực email"</strong></span>
            </li>
            <li class="step-item">
              <span class="step-num" aria-hidden="true">3</span>
              <span>Đăng nhập và bắt đầu sử dụng TaskFlow</span>
            </li>
          </ol>

          <!-- Spam notice -->
          <div class="spam-notice" role="note">
            <el-icon :size="14" color="#737686"><InfoFilled /></el-icon>
            <span>Không thấy email? Hãy kiểm tra thư mục <strong>Spam</strong> hoặc <strong>Junk</strong>.</span>
          </div>

          <!-- Actions -->
          <div class="card-actions">
            <router-link to="/login" class="btn-login">
              <el-icon><ArrowLeft /></el-icon>
              Quay lại đăng nhập
            </router-link>
          </div>
        </div>

        <!-- Footer note -->
        <p class="footer-note">
          Liên kết xác thực có hiệu lực trong <strong>24 giờ</strong>.
        </p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Check, Message, InfoFilled, ArrowLeft } from '@element-plus/icons-vue'

const route = useRoute()

const displayEmail = computed(() => route.query.email || 'địa chỉ email của bạn')
</script>

<style scoped>
/* ── Design tokens ───────────────────────────────────────────────────────────── */
.pending-page {
  --primary: #004ac6;
  --primary-container: #2563eb;
  --surface: #faf8ff;
  --surface-container-lowest: #ffffff;
  --surface-container-low: #f3f3fe;
  --surface-container: #ededf9;
  --on-surface: #191b23;
  --on-surface-variant: #434655;
  --outline: #737686;
  --outline-variant: #c3c6d7;
  --border-subtle: #e2e8f0;
}

/* ── Page shell ──────────────────────────────────────────────────────────────── */
.pending-page {
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
.pending-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  position: relative;
  z-index: 1;
}

.pending-container {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── Brand ───────────────────────────────────────────────────────────────────── */
.pending-brand {
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

.pending-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--on-surface);
  margin: 0;
}

/* ── Card ────────────────────────────────────────────────────────────────────── */
.pending-card {
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

/* ── Email icon ──────────────────────────────────────────────────────────────── */
.email-icon-wrap {
  width: 72px;
  height: 72px;
  background: rgba(0, 74, 198, 0.08);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
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
  max-width: 360px;
}

.email-highlight {
  color: var(--primary);
  font-weight: 600;
  word-break: break-all;
}

/* ── Steps ───────────────────────────────────────────────────────────────────── */
.steps-list {
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: var(--on-surface-variant);
}

.step-num {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  background: var(--surface-container);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--primary);
  margin-top: 0;
}

/* ── Spam notice ─────────────────────────────────────────────────────────────── */
.spam-notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: var(--surface-container-low);
  border: 1px solid var(--outline-variant);
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 400;
  line-height: 18px;
  color: var(--on-surface-variant);
  text-align: left;
  width: 100%;
  margin-bottom: 28px;
}

.spam-notice .el-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

/* ── Actions ─────────────────────────────────────────────────────────────────── */
.card-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-login {
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

.btn-login:hover {
  background: var(--surface-container-low);
  border-color: var(--outline);
  color: var(--on-surface);
}

/* ── Footer note ─────────────────────────────────────────────────────────────── */
.footer-note {
  margin-top: 24px;
  font-size: 13px;
  font-weight: 400;
  line-height: 18px;
  color: var(--outline);
  text-align: center;
}

/* ── Responsive ──────────────────────────────────────────────────────────────── */
@media (max-width: 480px) {
  .pending-card {
    padding: 32px 20px 24px;
  }

  .card-title {
    font-size: 18px;
  }
}
</style>
