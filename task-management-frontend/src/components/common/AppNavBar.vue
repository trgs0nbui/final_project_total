<template>
  <el-header class="app-navbar">
    <div class="navbar-container">
      <!-- Logo / App Name -->
      <div class="navbar-brand">
        <router-link to="/dashboard" class="brand-link">
          <img src="@/assets/logo.svg" alt="PM App Logo" class="brand-logo" />
          <span class="brand-name">PM App</span>
        </router-link>
      </div>

      <!-- Desktop Navigation Links -->
      <nav class="navbar-nav desktop-nav">
        <router-link to="/dashboard" class="nav-link" active-class="nav-link--active">
          Dashboard
        </router-link>
      </nav>

      <!-- Right Section: Username + Logout -->
      <div class="navbar-right desktop-right">
        <span class="navbar-username">
          <el-icon class="user-icon"><User /></el-icon>
          {{ authStore.user?.username }}
        </span>
        <el-button type="danger" size="small" plain @click="handleLogout">
          Đăng xuất
        </el-button>
      </div>

      <!-- Hamburger Button (mobile only) -->
      <button
        class="hamburger-btn"
        :class="{ 'is-active': mobileMenuOpen }"
        aria-label="Toggle navigation menu"
        @click="toggleMobileMenu"
      >
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>
    </div>

    <!-- Mobile Dropdown Menu -->
    <transition name="mobile-menu">
      <div v-if="mobileMenuOpen" class="mobile-menu">
        <div class="mobile-menu-user">
          <el-icon><User /></el-icon>
          <span>{{ authStore.user?.username }}</span>
        </div>
        <nav class="mobile-nav">
          <router-link
            to="/dashboard"
            class="mobile-nav-link"
            active-class="mobile-nav-link--active"
            @click="closeMobileMenu"
          >
            Dashboard
          </router-link>
        </nav>
        <div class="mobile-menu-footer">
          <el-button type="danger" size="small" plain style="width: 100%" @click="handleLogout">
            Đăng xuất
          </el-button>
        </div>
      </div>
    </transition>
  </el-header>
</template>

<script setup>
import { ref } from 'vue'
import { User } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const mobileMenuOpen = ref(false)

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

function handleLogout() {
  closeMobileMenu()
  authStore.logout()
}
</script>

<style scoped>
/* ── Base Navbar ─────────────────────────────────────────────────────────── */
.app-navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background-color: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 0;
  height: auto !important;
}

.navbar-container {
  display: flex;
  align-items: center;
  height: 60px;
  padding: 0 20px;
  max-width: 1280px;
  margin: 0 auto;
  gap: 16px;
}

/* ── Brand ───────────────────────────────────────────────────────────────── */
.navbar-brand {
  flex-shrink: 0;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: inherit;
}

.brand-logo {
  height: 28px;
  width: auto;
}

.brand-name {
  font-size: 18px;
  font-weight: 700;
  color: #409eff;
  letter-spacing: -0.3px;
}

/* ── Desktop Nav ─────────────────────────────────────────────────────────── */
.navbar-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.nav-link {
  padding: 6px 12px;
  border-radius: 6px;
  text-decoration: none;
  font-size: 14px;
  color: #606266;
  transition: background-color 0.2s, color 0.2s;
}

.nav-link:hover {
  background-color: #f0f2f5;
  color: #409eff;
}

.nav-link--active {
  background-color: #ecf5ff;
  color: #409eff;
  font-weight: 500;
}

/* ── Right Section ───────────────────────────────────────────────────────── */
.navbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  margin-left: auto;
}

.navbar-username {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.user-icon {
  font-size: 16px;
  color: #909399;
}

/* ── Hamburger Button ────────────────────────────────────────────────────── */
.hamburger-btn {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  margin-left: auto;
  transition: background-color 0.2s;
}

.hamburger-btn:hover {
  background-color: #f0f2f5;
}

.hamburger-line {
  display: block;
  width: 22px;
  height: 2px;
  background-color: #303133;
  border-radius: 2px;
  transition: transform 0.25s ease, opacity 0.25s ease;
  transform-origin: center;
}

/* Animate hamburger → X when active */
.hamburger-btn.is-active .hamburger-line:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.hamburger-btn.is-active .hamburger-line:nth-child(2) {
  opacity: 0;
  transform: scaleX(0);
}

.hamburger-btn.is-active .hamburger-line:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

/* ── Mobile Menu ─────────────────────────────────────────────────────────── */
.mobile-menu {
  background-color: #ffffff;
  border-top: 1px solid #e4e7ed;
  padding: 12px 20px 16px;
}

.mobile-menu-user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0 12px;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  border-bottom: 1px solid #f0f2f5;
  margin-bottom: 8px;
}

.mobile-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 12px;
}

.mobile-nav-link {
  display: block;
  padding: 10px 12px;
  border-radius: 6px;
  text-decoration: none;
  font-size: 14px;
  color: #606266;
  transition: background-color 0.2s, color 0.2s;
}

.mobile-nav-link:hover {
  background-color: #f0f2f5;
  color: #409eff;
}

.mobile-nav-link--active {
  background-color: #ecf5ff;
  color: #409eff;
  font-weight: 500;
}

.mobile-menu-footer {
  padding-top: 8px;
  border-top: 1px solid #f0f2f5;
}

/* ── Mobile Menu Transition ──────────────────────────────────────────────── */
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ── Responsive: hide/show at 768px ─────────────────────────────────────── */
@media (max-width: 767px) {
  .desktop-nav,
  .desktop-right {
    display: none;
  }

  .hamburger-btn {
    display: flex;
  }
}

@media (min-width: 768px) {
  .hamburger-btn {
    display: none;
  }

  .mobile-menu {
    display: none;
  }
}
</style>
