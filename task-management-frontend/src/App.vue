<script setup>
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppSidebar from '@/components/common/AppSidebar.vue'
import AppTopbar from '@/components/common/AppTopbar.vue'

const authStore = useAuthStore()
</script>

<template>
  <!-- Authenticated layout: fixed sidebar + sticky topbar + scrollable content -->
  <div v-if="authStore.isAuthenticated" class="app-layout">
    <AppSidebar />
    <div class="app-layout__body">
      <AppTopbar />
      <main class="app-layout__main">
        <RouterView />
      </main>
    </div>
  </div>

  <!-- Unauthenticated layout: full-page (login / register manage their own layout) -->
  <RouterView v-else />
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background-color: #faf8ff;
}

/* Offset the fixed 260px sidebar */
.app-layout__body {
  margin-left: 260px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.app-layout__main {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
  /* Prevent content from overflowing the flex column */
  min-width: 0;
}

.app-main--no-padding {
  padding: 0;
}
</style>
