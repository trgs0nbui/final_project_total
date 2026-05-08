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
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐        │
│  │PostgreSQL│  │  Redis   │  │  Celery Worker     │        │
│  │  :5432   │  │  :6379   │  │  + Celery Beat     │        │
│  └──────────┘  └──────────┘  └────────────────────┘        │
│                                                               │
│  Nginx (Production) — Reverse proxy + Static files          │
└─────────────────────────────────────────────────────────────┘
```

---

## Cấu Trúc Thư Mục

```
.
├── infra/                          # Docker infrastructure
│   ├── backend/                    # Backend Dockerfiles (dev + prod)
│   ├── frontend/                   # Frontend Dockerfiles (dev + prod)
│   ├── nginx/                      # Nginx configs (nginx.conf + default.conf)
│   ├── scripts/                    # Entrypoint scripts (tham chiếu)
│   ├── docker-compose.dev.yml      # Development stack (6 services)
│   ├── docker-compose.prod.yml     # Production stack (5 services + nginx)
│   ├── .env.example                # Template biến môi trường cho docker-compose
│   └── README.md                   # 📖 Hướng dẫn Docker setup
│
├── task-management-backend/        # Django REST API
│   ├── apps/
│   │   ├── users/                  # Xác thực, profile, email verification
│   │   ├── projects/               # Dự án, thành viên, phân quyền
│   │   ├── tasks/                  # Công việc, filter, kanban
│   │   ├── comments/               # Bình luận trên task
│   │   ├── notifications/          # Hệ thống thông báo
│   │   └── common/                 # Pagination, utilities
│   ├── config/                     # Settings & URLs
│   ├── docker/scripts/             # Entrypoint scripts (dev + prod)
│   ├── requirements/               # Python dependencies
│   ├── .env.example                # Template biến môi trường backend
│   └── README.md                   # 📖 Hướng dẫn backend setup
│
└── task-management-frontend/       # Vue 3 SPA
    ├── src/
    │   ├── components/             # Reusable components
    │   ├── views/                  # Page components
    │   ├── stores/                 # Pinia stores
    │   ├── router/                 # Vue Router
    │   ├── composables/            # Reusable logic
    │   └── services/               # API client (Axios)
    ├── .env.example                # Template biến môi trường frontend
    └── README.md                   # 📖 Hướng dẫn frontend setup
```

---

## Tính Năng Chính

### Quản Lý Người Dùng
- ✅ Đăng ký tài khoản với xác thực email bắt buộc (Gmail SMTP)
- ✅ Đăng nhập bằng username hoặc email
- ✅ JWT authentication (access token 60 phút, refresh token 7 ngày)
- ✅ Tự động refresh token khi hết hạn (silent refresh)
- ✅ Quản lý profile: full name, avatar upload (2MB max)

### Quản Lý Dự Án
- ✅ Tạo, xem, sửa, xóa dự án (owner only)
- ✅ Project key tự động uppercase (2-10 ký tự, A-Z0-9-)
- ✅ Phân loại: project type (software/business/service) + category
- ✅ Quản lý thành viên: thêm/xóa member (owner only)
- ✅ Phân quyền: owner vs member
- ✅ Tìm kiếm user để thêm vào dự án (debounced, cached)

### Quản Lý Công Việc
- ✅ Tạo, xem, sửa, xóa task
- ✅ Kanban board với drag & drop (3 cột: Todo, In Progress, Done)
- ✅ Table view với filter nâng cao: status, priority, assignee, due date range, search
- ✅ Gán task cho thành viên dự án
- ✅ Priority (low/medium/high) + due date
- ✅ Task detail drawer với comment thread

### Bình Luận
- ✅ Comment trên task
- ✅ Chỉnh sửa/xóa comment (author hoặc project owner)

### Hệ Thống Thông Báo
- ✅ Thông báo khi được giao task (`task_assigned`)
- ✅ Thông báo khi được thêm vào dự án (`project_member_added`)
- ✅ Thông báo nhắc nhở task sắp đến hạn trong 24 giờ (`task_due_soon`) — Celery Beat
- ✅ Badge số thông báo chưa đọc trên icon chuông (polling 60 giây)
- ✅ Dropdown preview 8 thông báo gần nhất
- ✅ Trang thông báo đầy đủ với filter theo loại và group theo ngày
- ✅ Đánh dấu đã đọc từng thông báo hoặc tất cả

### Caching & Performance
- ✅ Redis cache cho danh sách project, members, tasks, search results
- ✅ Celery Worker: cache invalidation bất đồng bộ, gửi thông báo
- ✅ Celery Beat: periodic task quét due-soon mỗi giờ
- ✅ Optimized queries với `select_related`, `annotate`, `distinct`

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
cp infra/.env.example infra/.env
cp task-management-backend/.env.example task-management-backend/.env
cp task-management-frontend/.env.example task-management-frontend/.env
```

Chỉnh sửa `task-management-backend/.env` — các biến bắt buộc:

```dotenv
SECRET_KEY=<django-secret-key-ngẫu-nhiên-≥50-ký-tự>
DATABASE_URL=postgresql://postgres:postgres@db:5432/task_management
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2
EMAIL_HOST_USER=your-gmail@gmail.com
EMAIL_HOST_PASSWORD=your-gmail-app-password
FRONTEND_URL=http://localhost:5173
```

**3. Khởi động stack**

```bash
docker compose -f infra/docker-compose.dev.yml up --build
```

**4. Chạy migration**

```bash
docker compose -f infra/docker-compose.dev.yml exec backend python manage.py migrate
```

**5. Truy cập ứng dụng**

| URL | Mô tả |
|---|---|
| `http://localhost:5173` | Frontend Vue 3 |
| `http://localhost:8000/api/` | Backend REST API |
| `http://localhost:8000/admin/` | Django Admin |

**6. Tạo superuser (tùy chọn)**

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
| [`infra/README.md`](infra/README.md) | Docker setup (dev & prod), services, Nginx, entrypoint |
| [`task-management-backend/README.md`](task-management-backend/README.md) | Backend API, models, services, tất cả endpoints |
| [`task-management-frontend/README.md`](task-management-frontend/README.md) | Frontend setup, routing, stores, components |

---

## Tech Stack

### Backend
| Thành phần | Công nghệ |
|---|---|
| Framework | Django 6.0 + Django REST Framework 3.17 |
| Authentication | JWT (djangorestframework-simplejwt) |
| Database | PostgreSQL 15 |
| Cache | Redis 7 + django-redis |
| Background Tasks | Celery 5.6 (Worker + Beat) |
| WSGI Server | Gunicorn (production) |

### Frontend
| Thành phần | Công nghệ |
|---|---|
| Framework | Vue 3.5 (Composition API) |
| Build Tool | Vite 8 |
| UI Library | Element Plus 2.13 |
| State Management | Pinia 3.0 + pinia-plugin-persistedstate |
| HTTP Client | Axios 1.16 |
| Routing | Vue Router 5 |

### Infrastructure
| Thành phần | Công nghệ |
|---|---|
| Containerization | Docker + Docker Compose v2 |
| Reverse Proxy | Nginx 1.25 |
| OS | Linux (Alpine-based images) |

---

## API Endpoints Tổng Hợp

### Authentication
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/auth/register/` | Đăng ký — gửi email xác thực |
| POST | `/api/auth/login/` | Đăng nhập — yêu cầu email đã xác thực |
| GET | `/api/auth/verify-email/?token=` | Xác thực email từ link |
| POST | `/api/auth/token/refresh/` | Refresh access token |

### Users
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/users/me/` | Profile hiện tại |
| PATCH | `/api/users/me/` | Cập nhật profile |
| POST | `/api/users/me/avatar/` | Upload avatar (max 2MB) |

### Projects
| Method | Endpoint | Mô tả |
|---|---|---|
| GET/POST | `/api/projects/` | Danh sách / Tạo mới |
| GET/PATCH/DELETE | `/api/projects/<id>/` | Chi tiết / Sửa / Xóa |
| GET/POST | `/api/projects/<id>/members/` | Danh sách / Thêm thành viên |
| DELETE | `/api/projects/<id>/members/<user_id>/` | Xóa thành viên |
| GET | `/api/projects/<id>/members/search/?q=` | Tìm user để thêm |
| GET | `/api/projects/member-stats/` | Thống kê thành viên |

### Tasks
| Method | Endpoint | Mô tả |
|---|---|---|
| GET/POST | `/api/projects/<id>/tasks/` | Danh sách (filter) / Tạo mới |
| GET/PATCH/DELETE | `/api/projects/<id>/tasks/<task_id>/` | Chi tiết / Sửa / Xóa |
| GET | `/api/tasks/` | Tasks được giao cho tôi |
| GET | `/api/tasks/stats/` | Thống kê tasks của tôi |

**Filter params cho tasks:** `status`, `priority`, `assignee`, `due_date_from`, `due_date_to`, `search`

### Comments
| Method | Endpoint | Mô tả |
|---|---|---|
| GET/POST | `/api/projects/<id>/tasks/<task_id>/comments/` | Danh sách / Tạo |
| PATCH/DELETE | `/api/comments/<id>/` | Sửa / Xóa (author only) |

### Notifications
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/notifications/` | Danh sách thông báo (`?unread=true`) |
| GET | `/api/notifications/unread-count/` | Số thông báo chưa đọc |
| PATCH | `/api/notifications/<id>/read/` | Đánh dấu 1 thông báo đã đọc |
| POST | `/api/notifications/mark-all-read/` | Đánh dấu tất cả đã đọc |

---

## Luồng Xác Thực Email

```
Đăng ký → Backend gửi email → User click link
    → /verify-email?token=<token>
    → GET /api/auth/verify-email/?token=<token>
    → is_email_verified = True
    → Đăng nhập được
```

> Email chưa xác thực → backend từ chối đăng nhập với lỗi rõ ràng.

---

## Luồng Thông Báo

```
Giao task     → Celery task → notify_task_assigned    → DB record
Thêm member   → Celery task → notify_project_member_added → DB record
Celery Beat   → mỗi giờ    → check_due_soon_tasks    → notify_task_due_soon
Frontend      → poll 60s   → GET /api/notifications/unread-count/ → badge
```

---

## Môi Trường Production

```bash
docker compose -f infra/docker-compose.prod.yml up --build -d
docker compose -f infra/docker-compose.prod.yml exec web python manage.py migrate
docker compose -f infra/docker-compose.prod.yml exec web python manage.py createsuperuser
```

Xem chi tiết tại [`infra/README.md`](infra/README.md#môi-trường-production).

---

## Testing

```bash
# Backend
docker compose -f infra/docker-compose.dev.yml exec backend pytest
docker compose -f infra/docker-compose.dev.yml exec backend pytest --cov=apps --cov-report=term-missing

# Frontend
docker compose -f infra/docker-compose.dev.yml exec frontend npm test
```

---

## Xử Lý Sự Cố Thường Gặp

| Vấn đề | Nguyên nhân | Giải pháp |
|---|---|---|
| Backend không kết nối DB | `POSTGRES_HOST=localhost` thay vì `db` | Sửa thành `db` trong `.env` |
| CORS error | `VITE_API_BASE_URL` sai | Set `http://localhost:8000` |
| Email không gửi được | App Password sai | Dùng Gmail App Password, không phải password thường |
| Link xác thực 404 | `FRONTEND_URL` trỏ về backend | Set `FRONTEND_URL=http://localhost:5173` |
| Thông báo không hiện | Celery worker không chạy | Kiểm tra `docker compose logs celery` |
| Build lỗi entrypoint | Script không trong build context | Script phải nằm trong `docker/scripts/` của backend |

**Reset toàn bộ:**
```bash
docker compose -f infra/docker-compose.dev.yml down -v
docker compose -f infra/docker-compose.dev.yml up --build
```

---

## Đóng Góp

1. Fork repository
2. Tạo feature branch: `git checkout -b feature/ten-tinh-nang`
3. Commit: `git commit -m 'feat: mô tả thay đổi'`
4. Push: `git push origin feature/ten-tinh-nang`
5. Mở Pull Request

---

## License

[MIT License](LICENSE)
