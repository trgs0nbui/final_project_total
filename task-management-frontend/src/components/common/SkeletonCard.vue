<script setup>
defineProps({
  count: {
    type: Number,
    default: 6,
  },
})
</script>

<template>
  <div class="skeleton-grid">
    <div v-for="n in count" :key="n" class="skeleton-card">
      <el-skeleton animated>
        <template #template>
          <!-- Top row: icon + badge -->
          <div class="skeleton-top">
            <el-skeleton-item variant="image" class="skeleton-icon" />
            <el-skeleton-item variant="text" class="skeleton-badge" />
          </div>
          <!-- Title -->
          <el-skeleton-item variant="h3" class="skeleton-title" />
          <!-- Description lines -->
          <el-skeleton-item variant="text" class="skeleton-line" />
          <el-skeleton-item variant="text" class="skeleton-line skeleton-line--short" />
          <!-- Tags -->
          <div class="skeleton-tags">
            <el-skeleton-item variant="text" class="skeleton-tag" />
            <el-skeleton-item variant="text" class="skeleton-tag skeleton-tag--sm" />
          </div>
          <!-- Footer -->
          <div class="skeleton-footer">
            <el-skeleton-item variant="text" class="skeleton-meta" />
            <el-skeleton-item variant="text" class="skeleton-action" />
          </div>
        </template>
      </el-skeleton>
    </div>
  </div>
</template>

<style scoped>
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.skeleton-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
}

.skeleton-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
}

.skeleton-badge {
  width: 56px;
  height: 20px;
  border-radius: 4px;
}

.skeleton-title {
  width: 65%;
  height: 20px;
}

.skeleton-line {
  width: 100%;
  height: 13px;
}

.skeleton-line--short {
  width: 80%;
}

.skeleton-tags {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}

.skeleton-tag {
  width: 72px;
  height: 20px;
  border-radius: 9999px;
}

.skeleton-tag--sm {
  width: 52px;
}

.skeleton-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.skeleton-meta {
  width: 40%;
  height: 13px;
}

.skeleton-action {
  width: 24px;
  height: 24px;
  border-radius: 6px;
}
</style>
