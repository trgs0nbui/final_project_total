import logging
from typing import Optional

from django.db.models import QuerySet

from .models import Notification

logger = logging.getLogger(__name__)


class NotificationRepository:
    """
    Đảm nhận toàn bộ thao tác database liên quan đến Notification.
    Không chứa business logic — chỉ thực hiện CRUD và truy vấn thuần túy.
    """

    @staticmethod
    def create(
        recipient,
        notification_type: str,
        title: str,
        message: str,
        actor=None,
        project_id=None,
        task_id=None,
    ) -> Notification:
        """Tạo và lưu một Notification mới."""
        notification = Notification.objects.create(
            recipient=recipient,
            actor=actor,
            notification_type=notification_type,
            title=title,
            message=message,
            project_id=project_id,
            task_id=task_id,
        )
        logger.debug(
            f"NotificationRepository.create: id={notification.id}, "
            f"type={notification_type}, recipient_id={recipient.id}"
        )
        return notification

    @staticmethod
    def get_for_user(user, unread_only: bool = False) -> QuerySet:
        """
        Trả về queryset thông báo của user, mới nhất trước.
        Nếu unread_only=True, chỉ trả về thông báo chưa đọc.
        """
        qs = (
            Notification.objects
            .filter(recipient=user)
            .select_related('actor')
            .order_by('-created_at')
        )
        if unread_only:
            qs = qs.filter(is_read=False)
        return qs

    @staticmethod
    def get_by_id(notification_id) -> Optional[Notification]:
        """Lấy Notification theo PK. Trả về None nếu không tìm thấy."""
        try:
            return Notification.objects.get(id=notification_id)
        except Notification.DoesNotExist:
            return None

    @staticmethod
    def mark_as_read(notification: Notification) -> Notification:
        """Đánh dấu một thông báo là đã đọc."""
        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=['is_read'])
        return notification

    @staticmethod
    def mark_all_as_read(user) -> int:
        """
        Đánh dấu tất cả thông báo chưa đọc của user là đã đọc.
        Trả về số lượng bản ghi được cập nhật.
        """
        count = Notification.objects.filter(recipient=user, is_read=False).update(is_read=True)
        logger.debug(f"NotificationRepository.mark_all_as_read: user_id={user.id}, count={count}")
        return count

    @staticmethod
    def count_unread(user) -> int:
        """Đếm số thông báo chưa đọc của user."""
        return Notification.objects.filter(recipient=user, is_read=False).count()

    @staticmethod
    def bulk_create(notifications: list) -> list:
        """
        Tạo nhiều Notification cùng lúc (dùng cho due_soon batch).
        Trả về danh sách instance đã tạo.
        """
        created = Notification.objects.bulk_create(notifications, ignore_conflicts=True)
        logger.debug(f"NotificationRepository.bulk_create: count={len(created)}")
        return created
