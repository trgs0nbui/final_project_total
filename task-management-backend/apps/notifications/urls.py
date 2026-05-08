from django.urls import path

from . import views

urlpatterns = [
    # GET  /api/notifications/               — danh sách thông báo (có filter ?unread=true)
    path('', views.NotificationListView.as_view(), name='notification-list'),

    # GET  /api/notifications/unread-count/  — số thông báo chưa đọc (dùng cho badge)
    path('unread-count/', views.NotificationUnreadCountView.as_view(), name='notification-unread-count'),

    # POST /api/notifications/mark-all-read/ — đánh dấu tất cả đã đọc
    path('mark-all-read/', views.NotificationMarkAllReadView.as_view(), name='notification-mark-all-read'),

    # PATCH /api/notifications/<pk>/read/    — đánh dấu một thông báo đã đọc
    path('<uuid:pk>/read/', views.NotificationMarkReadView.as_view(), name='notification-mark-read'),
]
