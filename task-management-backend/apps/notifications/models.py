import uuid

from django.conf import settings
from django.db import models

from .enums import NotificationType


class Notification(models.Model):
    """
    Thông báo trong hệ thống gửi đến người dùng.

    Các loại thông báo:
        - task_assigned:        Được giao một task mới.
        - task_due_soon:        Task sắp đến hạn (trong vòng 24 giờ).
        - project_member_added: Được thêm vào một dự án.

    actor:   Người thực hiện hành động (người giao task, người thêm member).
             Có thể null nếu thông báo do hệ thống tạo (ví dụ: due_soon).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        db_index=True,
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='sent_notifications',
    )

    notification_type = models.CharField(
        max_length=30,
        choices=NotificationType.choices,
        db_index=True,
    )

    # Nội dung thông báo
    title = models.CharField(max_length=255)
    message = models.TextField()

    # Generic FK-style references (lưu UUID dạng string để tránh phụ thuộc circular)
    project_id = models.UUIDField(null=True, blank=True)
    task_id = models.UUIDField(null=True, blank=True)

    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'notifications'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read'], name='notif_recipient_read_idx'),
            models.Index(fields=['recipient', 'created_at'], name='notif_recipient_created_idx'),
        ]

    def __str__(self):
        return f'[{self.notification_type}] → {self.recipient_id}'
