<script setup>
/**
 * SettingsView — trang cài đặt (placeholder).
 */
import { Setting } from '@element-plus/icons-vue'
</script>

<template>
  <div class="settings-view">
    <div class="settings-view__header">
      <h2 class="settings-view__title">Cài đặt</h2>
      <p class="settings-view__subtitle">Tùy chỉnh tài khoản và ứng dụng.</p>
    </div>

    <div class="settings-view__placeholder">
      <div class="placeholder__icon" aria-hidden="true">
        <el-icon :size="40"><Setting /></el-icon>
      </div>
      <h3 class="placeholder__title">Sắp ra mắt</h3>
      <p class="placeholder__desc">
        Trang cài đặt đang được phát triển. Bạn có thể cập nhật thông tin cá nhân trong trang hồ sơ.
      </p>
      <router-link to="/profile" class="placeholder__link"> Đi đến hồ sơ cá nhân → </router-link>
    </div>
  </div>
</template>

<style scoped>
.settings-view {
  --primary: #004ac6;
  --on-surface: #191b23;
  --on-surface-variant: #434655;
  --outline: #737686;
  --surface-container-low: #f3f3fe;
  --border-subtle: #e2e8f0;

  max-width: 1200px;
  margin: 0 auto;
}

.settings-view__header {
  margin-bottom: 32px;
}

.settings-view__title {
  font-size: 24px;
  font-weight: 700;
  line-height: 32px;
  letter-spacing: -0.02em;
  color: var(--on-surface);
  margin: 0 0 4px;
}

.settings-view__subtitle {
  font-size: 14px;
  color: var(--on-surface-variant);
  margin: 0;
}

.settings-view__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 360px;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 48px 32px;
  gap: 12px;
}

.placeholder__icon {
  width: 72px;
  height: 72px;
  background: var(--surface-container-low);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--outline);
  margin-bottom: 8px;
}

.placeholder__title {
  font-size: 18px;
  font-weight: 700;
  color: var(--on-surface);
  margin: 0;
}

.placeholder__desc {
  font-size: 14px;
  color: var(--on-surface-variant);
  margin: 0;
  max-width: 400px;
  line-height: 1.6;
}

.placeholder__link {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary);
  text-decoration: none;
  margin-top: 4px;
}

.placeholder__link:hover {
  text-decoration: underline;
}
</style>
