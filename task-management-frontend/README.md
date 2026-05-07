# TaskFlow Frontend

Ứng dụng quản lý dự án và công việc, xây dựng bằng **Vue 3** + **Vite** + **Element Plus**.

---

## Tech stack

| Thư viện | Phiên bản | Mục đích |
|---|---|---|
| Vue 3 | ^3.5 | Framework UI (Composition API) |
| Vue Router | ^5.0 | Client-side routing |
| Pinia | ^3.0 | State management |
| pinia-plugin-persistedstate | ^4.7 | Persist auth state vào localStorage |
| Element Plus | ^2.13 | Component library |
| Axios | ^1.16 | HTTP client |
| Vite | ^8.0 | Build tool & dev server |
| Vitest | ^4.1 | Unit testing |

---

## Yêu cầu hệ thống

| Công cụ | Phiên bản |
|---|---|
| Node.js | `^20.19.0` hoặc `>=22.12.0` |
| npm | đi kèm Node.js |

Kiểm tra:
```bash
node --version
npm --version
```

---

## Cài đặt và chạy local (không Docker)

### 1. Cài dependencies

```bash
cd task-management-frontend
npm install
```

### 2. Cấu hình biến môi trường

```bash
cp .env.example .env
```

Mở `.env` và điền:

```dotenv
# URL của backend Django API
VITE_API_BASE_URL=http://localhost:8000
```

> Nếu backend chạy ở cổng khác, thay đổi giá trị tương ứng.

### 3. Khởi động dev server

```bash
npm run dev
```

Ứng dụng chạy tại `http://localhost:5173` với hot-reload.

---

## Chạy với Docker (qua infra)

Frontend được tích hợp vào Docker stack ở thư mục `infra/`. Xem hướng dẫn đầy đủ tại [`infra/README.md`](../infra/README.md).

Tóm tắt nhanh:

```bash
# Từ thư mục gốc của project
docker compose -f infra/docker-compose.dev.yml up --build
```

Frontend sẽ chạy tại `http://localhost:5173`.

---

## Cấu trúc thư mục `src/`

```
src/
├── assets/              # Static assets (hình ảnh, fonts)
├── components/          # Reusable components
│   ├── common/          # Layout, navigation, shared UI
│   ├── project/         # Components liên quan đến Project
│   └── task/            # Components liên quan đến Task
├── router/
│   └── index.js         # Route definitions + navigation guards
├── services/
│   └── apiClient.js     # Axios instance, interceptors, token refresh
├── stores/
│   └── auth.js          # Pinia store: auth state, login/register/logout
├── views/
│   ├── auth/
│   │   ├── LoginView.vue
│   │   ├── RegisterView.vue
│   │   ├── VerifyEmailView.vue        # Xử lý link xác thực từ email
│   │   └── PendingVerificationView.vue # Thông báo sau khi đăng ký
│   ├── DashboardView.vue
│   ├── ProjectsView.vue
│   ├── ProjectDetailView.vue
│   ├── ProjectMembersView.vue
│   ├── TasksView.vue
│   ├── TeamView.vue
│   ├── ProfileView.vue
│   ├── SettingsView.vue
│   └── NotFoundView.vue
└── main.js
```

---

## Biến môi trường

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `VITE_API_BASE_URL` | ✅ | Base URL của backend API, ví dụ `http://localhost:8000` |

> Tất cả biến Vite phải có prefix `VITE_` để được expose ra client-side code.

---

## Routing và xác thực

Router sử dụng navigation guard `beforeEach` với 2 quy tắc:

- Route có `meta.requiresAuth: true` → redirect về `/login` nếu chưa đăng nhập
- Route `/login` hoặc `/register` → redirect về `/dashboard` nếu đã đăng nhập

### Danh sách routes

| Path | Tên | Auth | Mô tả |
|---|---|---|---|
| `/login` | `login` | Không | Đăng nhập |
| `/register` | `register` | Không | Đăng ký tài khoản |
| `/verify-email` | `verify-email` | Không | Xử lý token xác thực email |
| `/verify-email/pending` | `verify-email-pending` | Không | Thông báo chờ xác thực |
| `/dashboard` | `dashboard` | ✅ | Tổng quan |
| `/projects` | `projects` | ✅ | Danh sách dự án |
| `/projects/:id` | `project-detail` | ✅ | Chi tiết dự án |
| `/projects/:id/members` | `project-members` | ✅ | Quản lý thành viên |
| `/tasks` | `tasks` | ✅ | Danh sách công việc |
| `/team` | `team` | ✅ | Quản lý nhóm |
| `/profile` | `profile` | ✅ | Hồ sơ cá nhân |
| `/settings` | `settings` | ✅ | Cài đặt |

---

## Luồng xác thực email

Sau khi đăng ký, người dùng **bắt buộc phải xác thực email** trước khi đăng nhập:

1. Người dùng đăng ký → backend gửi email chứa link `http://<FRONTEND_URL>/verify-email?token=<token>`
2. Frontend redirect sang `/verify-email/pending` — hiển thị hướng dẫn kiểm tra email
3. Người dùng click link trong email → `VerifyEmailView` gọi `GET /api/auth/verify-email/?token=...`
4. Xác thực thành công → hiển thị thông báo và link đăng nhập
5. Nếu cố đăng nhập khi chưa xác thực → backend trả lỗi, frontend hiển thị thông báo kèm link hướng dẫn

---

## Scripts

```bash
# Chạy dev server
npm run dev

# Build production
npm run build

# Preview bản build production
npm run preview

# Chạy unit tests (single run)
npm test

# Chạy unit tests ở watch mode
npm run test:watch

# Format code với Prettier
npm run format
```

---

## Build production

```bash
npm run build
```

Output nằm ở thư mục `dist/`. Đây là static files có thể serve bằng bất kỳ web server nào (Nginx, Apache, CDN).

Khi build cần truyền `VITE_API_BASE_URL` đúng với môi trường production:

```bash
VITE_API_BASE_URL=https://api.yourdomain.com npm run build
```

Hoặc qua Docker build arg (xem `infra/frontend/Dockerfile.prod`):

```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://api.yourdomain.com \
  -f infra/frontend/Dockerfile.prod \
  task-management-frontend/
```

---

## Xử lý sự cố thường gặp

**`npm install` lỗi do Node version không đúng**

Project yêu cầu Node `^20.19.0` hoặc `>=22.12.0`. Dùng [nvm](https://github.com/nvm-sh/nvm) để quản lý version:

```bash
nvm install 22
nvm use 22
```

**API calls bị lỗi CORS**

Đảm bảo `VITE_API_BASE_URL` trong `.env` trỏ đúng về backend. Backend phải có `http://localhost:5173` trong `CORS_ALLOWED_ORIGINS`.

**Trang trắng sau khi build**

Kiểm tra `base` trong `vite.config.js` có khớp với đường dẫn deploy. Nếu deploy ở subdirectory, thêm:

```js
// vite.config.js
export default defineConfig({
  base: '/your-subpath/',
  // ...
})
```

**Lỗi `localStorage` / auth state bị mất sau refresh**

Auth state được persist qua `pinia-plugin-persistedstate` vào key `auth` trong localStorage. Nếu bị mất, kiểm tra browser không ở chế độ private/incognito hoặc không block localStorage.
