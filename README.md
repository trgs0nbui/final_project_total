# TaskFlow — Hệ Thống Quản Lý Dự Án & Công Việc

Hệ thống quản lý dự án và công việc theo nhóm, xây dựng bằng **Django REST Framework** (backend) và **Vue 3** (frontend), với Docker stack đầy đủ cho cả development và production.

---

## Tổng Quan Kiến Trúc

```
┌─────────────────────────────────────────────────────────────┐
│                      TASKFLOW SYSTEM                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (Vue 3 + Vite + Element Plus)                      │
│    ↓ HTTP/REST API                                           │
│  Backend (Django REST Framework + JWT)                       │
│    ↓                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │PostgreSQL│  │  Redis   │  │  Celery  │                  │
│  │  :5432   │  │  :6379   │  │  Worker  │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
│                                                               │
│  Nginx (Production) — Reverse proxy + Static files          │
└─────────────────────────────────────────────────────────────┘
```

---

## Cấu Trúc Thư Mục

```
.
├── infra/                          # Docker infrastructure
│   ├── backend/                    # Backend Dockerfiles
│   ├── frontend/                   # Frontend Dockerfiles
│   ├── nginx/                      # Nginx configs
│   ├── scripts/                    # Entrypoint scripts
│   ├── docker-compose.dev.yml      # Development stack
│   ├── docker-compose.prod.yml     # Production stack
│   ├── .env.example                # Template biến môi trường cho docker-compose
│   └── README.md                   # 📖 Hướng dẫn Docker setup
│
├── task-management-backend/        # Django REST API
│   ├── apps/                       # Django apps (users, projects, tasks, comments)
│   ├── config/                     # Settings & URLs
│   ├── requirements/               # Python dependencies
│   ├── .env.example                # Template biến môi trường backend
│   └── README.md                   # 📖 Hướng dẫn backend setup
│
└── task-management-frontend/       # Vue 3 SPA
    ├── src/                        # Source code
    │   ├── components/             # Reusable components
    │   ├── views/                  # Page components
    │   ├── stores/                 # Pinia stores
    │   ├── router/                 # Vue Router
    │   └── services/               # API client
    ├── .env.example                # Template biến môi trường frontend
    └── README.md                   # 📖 Hướng dẫn frontend setup
```

---

## Tính Năng Chính

### Quản Lý Người Dùng
- ✅ Đăng ký tài khoản với xác thực email (Gmail SMTP)
- ✅ Đăng nhập bằng username hoặc email
- ✅ JWT authentication (access token 60 phút, refresh token 7 ngày)
- ✅ Tự động refresh token khi hết hạn
- ✅ Quản lý profile: full name, avatar upload (2MB max)
- ✅ Email verification bắt buộc trước khi đăng nhập

### Quản Lý Dự Án
- ✅ Tạo, xem, sửa, xóa dự án (owner only)
- ✅ Project key tự động uppercase (2-10 ký tự, A-Z0-9-)
- ✅ Phân loại: project type (software/business/service) + category
- ✅ Quản lý thành viên: thêm/xóa member (owner only)
- ✅ Phân quyền: owner vs member
- ✅ Tìm kiếm user để thêm vào dự án

### Quản Lý Công Việc
- ✅ Tạo, xem, sửa, xóa task
- ✅ Kanban board với drag & drop (3 cột: Todo, In Progress, Done)
- ✅ Table view với filter & search
- ✅ Gán task cho thành viên
- ✅ Priority (low/medium/high) + due date
- ✅ Task detail drawer với comment thread

### Bình Luận
- ✅ Comment trên task
- ✅ Real-time update (polling)
- ✅ Markdown support (tùy chọn)

### Caching & Performance
- ✅ Redis cache cho danh sách project, members, search results
- ✅ Celery background tasks cho cache invalidation
- ✅ Optimized queries với select_related, prefetch_related, annotate

---

## Bắt Đầu Nhanh

### Yêu Cầu Hệ Thống

| Công cụ | Phiên bản |
|---|---|
| Docker | ≥ 24.x |
| Docker Compose | v2.x (plugin) |

**Hoặc chạy local không Docker:**

| Công cụ | Phiên bản |
|---|---|
| Python | ≥ 3.11 |
| Node.js | ^20.19.0 hoặc ≥22.12.0 |
| PostgreSQL | ≥ 13 |
| Redis | ≥ 7 |

---

### Chạy Với Docker (Recommended)

**1. Clone repository**

```bash
git clone <repository-url>
cd <repository-name>
```

**2. Cấu hình biến môi trường**

```bash
# Infra (docker-compose)
cp infra/.env.example infra/.env

# Backend
cp task-management-backend/.env.example task-management-backend/.env

# Frontend
cp task-management-frontend/.env.example task-management-frontend/.env
```

Chỉnh sửa các file `.env` theo hướng dẫn trong từng file. **Quan trọng:**
- `task-management-backend/.env`: Điền `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` (Gmail App Password)
- `task-management-backend/.env`: Set `FRONTEND_URL=http://localhost:5173`
- `task-management-frontend/.env`: Set `VITE_API_BASE_URL=http://localhost:8000`

**3. Khởi động stack**

```bash
docker compose -f infra/docker-compose.dev.yml up --build
```

**4. Truy cập ứng dụng**

| URL | Mô tả |
|---|---|
| `http://localhost:5173` | Frontend Vue 3 |
| `http://localhost:8000/api/` | Backend API |
| `http://localhost:8000/admin/` | Django Admin |

**5. Tạo superuser (tùy chọn)**

```bash
docker compose -f infra/docker-compose.dev.yml exec backend python manage.py createsuperuser
```

---

### Chạy Local Không Docker

Xem hướng dẫn chi tiết tại:
- Backend: [`task-management-backend/README.md`](task-management-backend/README.md)
- Frontend: [`task-management-frontend/README.md`](task-management-frontend/README.md)

---

## Tài Liệu Chi Tiết

| Tài liệu | Mô tả |
|---|---|
| [`infra/README.md`](infra/README.md) | Hướng dẫn Docker setup (dev & prod), Nginx, SSL |
| [`task-management-backend/README.md`](task-management-backend/README.md) | Backend API, models, services, endpoints |
| [`task-management-frontend/README.md`](task-management-frontend/README.md) | Frontend setup, routing, stores, components |

---

## Tech Stack

### Backend
- **Framework:** Django 6.0 + Django REST Framework 3.17
- **Authentication:** JWT (djangorestframework-simplejwt)
- **Database:** PostgreSQL 15
- **Cache:** Redis 7
- **Background Tasks:** Celery 5.6
- **WSGI Server:** Gunicorn (production)

### Frontend
- **Framework:** Vue 3.5 (Composition API)
- **Build Tool:** Vite 8
- **UI Library:** Element Plus 2.13
- **State Management:** Pinia 3.0 (với persistedstate)
- **HTTP Client:** Axios 1.16
- **Routing:** Vue Router 5

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **Reverse Proxy:** Nginx 1.25
- **CI/CD:** (Chưa setup)

---

## Luồng Xác Thực Email

1. User đăng ký → Backend gửi email chứa link xác thực
2. Link dẫn về frontend: `http://localhost:5173/verify-email?token=<token>`
3. Frontend gọi `GET /api/auth/verify-email/?token=<token>`
4. Backend xác thực token → set `is_email_verified=True`
5. User đăng nhập → Backend check `is_email_verified` trước khi issue JWT

> **Lưu ý:** Email chưa xác thực → không thể đăng nhập.

---

## API Endpoints

### Authentication
- `POST /api/auth/register/` — Đăng ký (gửi email xác thực)
- `POST /api/auth/login/` — Đăng nhập (yêu cầu email đã xác thực)
- `GET /api/auth/verify-email/?token=<token>` — Xác thực email
- `POST /api/auth/token/refresh/` — Refresh access token

### Users
- `GET /api/users/me/` — Profile hiện tại
- `PATCH /api/users/me/` — Cập nhật profile
- `POST /api/users/me/avatar/` — Upload avatar

### Projects
- `GET /api/projects/` — Danh sách project (user là member)
- `POST /api/projects/` — Tạo project mới
- `GET /api/projects/<id>/` — Chi tiết project
- `PATCH /api/projects/<id>/` — Cập nhật project (owner only)
- `DELETE /api/projects/<id>/` — Xóa project (owner only)

### Project Members
- `GET /api/projects/<id>/members/` — Danh sách thành viên
- `POST /api/projects/<id>/members/` — Thêm thành viên (owner only)
- `DELETE /api/projects/<id>/members/<user_id>/` — Xóa thành viên (owner only)
- `GET /api/projects/<id>/members/search/?q=<query>` — Tìm user để thêm

### Tasks
- `GET /api/projects/<id>/tasks/` — Danh sách task (hỗ trợ filter)
- `POST /api/projects/<id>/tasks/` — Tạo task mới
- `GET /api/projects/<id>/tasks/<task_id>/` — Chi tiết task
- `PATCH /api/projects/<id>/tasks/<task_id>/` — Cập nhật task
- `DELETE /api/projects/<id>/tasks/<task_id>/` — Xóa task (owner only)

### Comments
- `GET /api/projects/<id>/tasks/<task_id>/comments/` — Danh sách comment
- `POST /api/projects/<id>/tasks/<task_id>/comments/` — Tạo comment
- `PATCH /api/comments/<id>/` — Sửa comment (author only)
- `DELETE /api/comments/<id>/` — Xóa comment (author only)

---

## Môi Trường Production

Xem hướng dẫn đầy đủ tại [`infra/README.md`](infra/README.md#môi-trường-production).

Tóm tắt:
```bash
# Build và chạy production stack
docker compose -f infra/docker-compose.prod.yml up --build -d

# Tạo superuser
docker compose -f infra/docker-compose.prod.yml exec web python manage.py createsuperuser
```

**Lưu ý production:**
- Set `DEBUG=False` trong backend `.env`
- Dùng `SECRET_KEY` dài ngẫu nhiên (≥50 ký tự)
- Cấu hình `ALLOWED_HOSTS` đúng domain
- Set `FRONTEND_URL` về domain thực (https://yourdomain.com)
- Cấu hình SSL/TLS cho Nginx (xem hướng dẫn trong `infra/README.md`)

---

## Testing

### Backend
```bash
# Chạy toàn bộ tests
docker compose -f infra/docker-compose.dev.yml exec backend pytest

# Với coverage
docker compose -f infra/docker-compose.dev.yml exec backend pytest --cov=apps --cov-report=term-missing
```

### Frontend
```bash
# Chạy unit tests
docker compose -f infra/docker-compose.dev.yml exec frontend npm test

# Watch mode
docker compose -f infra/docker-compose.dev.yml exec frontend npm run test:watch
```

---

## Xử Lý Sự Cố

**Backend không kết nối được database**
- Kiểm tra `DATABASE_URL` trong `task-management-backend/.env` có hostname `db` (không phải `localhost`)
- Kiểm tra credentials khớp với `infra/.env`

**Frontend không gọi được API (CORS error)**
- Đảm bảo `VITE_API_BASE_URL=http://localhost:8000` trong `task-management-frontend/.env`
- Backend phải có `http://localhost:5173` trong `CORS_ALLOWED_ORIGINS`

**Email xác thực không gửi được**
- Kiểm tra `EMAIL_HOST_USER` và `EMAIL_HOST_PASSWORD` (phải là Gmail App Password)
- Kiểm tra `FRONTEND_URL=http://localhost:5173` (đúng cổng frontend)

**Port đã bị chiếm**
```bash
# Windows
netstat -ano | findstr :8000

# macOS/Linux
lsof -i :8000
```

**Reset toàn bộ (xóa database, cache)**
```bash
docker compose -f infra/docker-compose.dev.yml down -v
docker compose -f infra/docker-compose.dev.yml up --build
```

---

## Đóng Góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

---

## License

[MIT License](LICENSE) — tự do sử dụng cho mục đích cá nhân và thương mại.

---

## Liên Hệ & Hỗ Trợ

- **Issues:** [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email:** support@taskflow.example.com
