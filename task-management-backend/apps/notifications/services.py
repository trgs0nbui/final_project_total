import logging

from .enums import NotificationType
from .models import Notification
from .repositories import NotificationRepository

logger = logging.getLogger(__name__)


class NotificationService:
    """
    Service xử lý logic nghiệp vụ liên quan đến Notification.
    Tất cả thao tác DB được uỷ quyền cho NotificationRepository.
    """

    # ── Tạo thông báo ────────────────────────────────────────────────────────

    @staticmethod
    def notify_task_assigned(task, actor) -> None:
        """
        Tạo thông báo cho assignee khi được giao task.
        Không tạo nếu assignee chính là người giao (actor).

        Args:
            task:  Task instance vừa được giao.
            actor: User instance thực hiện giao task.
        """
        assignee = task.assignee
        if assignee is None:
            return
        if str(assignee.id) == str(actor.id):
            return

        NotificationRepository.create(
            recipient=assignee,
            actor=actor,
            notification_type=NotificationType.TASK_ASSIGNED,
            title='Bạn được giao một công việc mới',
            message=(
                f'{actor.username} đã giao công việc '
                f'"{task.title}" trong dự án "{task.project.name}" cho bạn.'
            ),
            project_id=task.project_id,
            task_id=task.id,
        )
        logger.info(
            f"NotificationService.notify_task_assigned: "
            f"task_id={task.id}, assignee_id={assignee.id}, actor_id={actor.id}"
        )

    @staticmethod
    def notify_project_member_added(project, new_member, actor) -> None:
        """
        Tạo thông báo cho user khi được thêm vào dự án.
        Không tạo nếu new_member chính là actor (tự thêm mình).

        Args:
            project:    Project instance.
            new_member: User instance vừa được thêm.
            actor:      User instance thực hiện thêm (owner).
        """
        if str(new_member.id) == str(actor.id):
            return

        NotificationRepository.create(
            recipient=new_member,
            actor=actor,
            notification_type=NotificationType.PROJECT_MEMBER_ADDED,
            title='Bạn được thêm vào một dự án',
            message=(
                f'{actor.username} đã thêm bạn vào dự án "{project.name}".'
            ),
            project_id=project.id,
        )
        logger.info(
            f"NotificationService.notify_project_member_added: "
            f"project_id={project.id}, member_id={new_member.id}, actor_id={actor.id}"
        )

    @staticmethod
    def notify_task_due_soon(task) -> None:
        """
        Tạo thông báo nhắc nhở assignee khi task sắp đến hạn (trong 24 giờ).
        Được gọi bởi Celery periodic task — không có actor.

        Args:
            task: Task instance sắp đến hạn.
        """
        assignee = task.assignee
        if assignee is None:
            return

        due_str = task.due_date.strftime('%d/%m/%Y') if task.due_date else ''

        NotificationRepository.create(
            recipient=assignee,
            actor=None,
            notification_type=NotificationType.TASK_DUE_SOON,
            title='Công việc sắp đến hạn',
            message=(
                f'Công việc "{task.title}" trong dự án "{task.project.name}" '
                f'sẽ đến hạn vào ngày {due_str}. Hãy hoàn thành đúng hạn!'
            ),
            project_id=task.project_id,
            task_id=task.id,
        )
        logger.info(
            f"NotificationService.notify_task_due_soon: "
            f"task_id={task.id}, assignee_id={assignee.id}"
        )

    # ── Đọc thông báo ────────────────────────────────────────────────────────

    @staticmethod
    def get_notifications(user, unread_only: bool = False):
        """
        Trả về queryset thông báo của user.

        Args:
            user:        User instance.
            unread_only: Nếu True, chỉ trả về thông báo chưa đọc.

        Returns:
            QuerySet[Notification]
        """
        return NotificationRepository.get_for_user(user, unread_only=unread_only)

    @staticmethod
    def get_unread_count(user) -> int:
        """Trả về số thông báo chưa đọc của user."""
        return NotificationRepository.count_unread(user)

    @staticmethod
    def mark_as_read(user, notification_id) -> Notification:
        """
        Đánh dấu một thông báo là đã đọc.
        Chỉ cho phép đánh dấu thông báo của chính user.

        Raises:
            PermissionError: Nếu thông báo không thuộc về user.
            LookupError:     Nếu không tìm thấy thông báo.
        """
        from rest_framework.exceptions import NotFound, PermissionDenied

        notification = NotificationRepository.get_by_id(notification_id)
        if notification is None:
            raise NotFound('Thông báo không tồn tại.')
        if str(notification.recipient_id) != str(user.id):
            raise PermissionDenied('Bạn không có quyền truy cập thông báo này.')

        return NotificationRepository.mark_as_read(notification)

    @staticmethod
    def mark_all_as_read(user) -> int:
        """
        Đánh dấu tất cả thông báo chưa đọc của user là đã đọc.
        Trả về số lượng thông báo được cập nhật.
        """
        return NotificationRepository.mark_all_as_read(user)
