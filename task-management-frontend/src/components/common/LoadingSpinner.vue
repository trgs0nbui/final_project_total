<script setup>
const props = defineProps({
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value),
  },
  color: {
    type: String,
    default: '#409eff',
  },
})

const sizeMap = {
  small: '24px',
  medium: '40px',
  large: '56px',
}
</script>

<template>
  <div class="loading-spinner-wrapper" role="status" aria-label="Đang tải...">
    <div
      class="loading-spinner"
      :style="{
        width: sizeMap[size],
        height: sizeMap[size],
        borderTopColor: color,
        borderRightColor: color,
      }"
    />
    <span class="sr-only">Đang tải...</span>
  </div>
</template>

<style scoped>
.loading-spinner-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.loading-spinner {
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: #409eff;
  border-right-color: #409eff;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
