<template>
  <div class="not-found-container">
    <el-result
      icon="warning"
      title="404"
      sub-title="Trang bạn tìm kiếm không tồn tại hoặc đã bị xóa."
    >
      <template #extra>
        <el-button type="primary" size="large" @click="goToDashboard">
          Quay về Dashboard
        </el-button>
      </template>
    </el-result>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goToDashboard() {
  router.push('/dashboard')
}
</script>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
</style>
