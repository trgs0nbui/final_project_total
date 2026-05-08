import logging
from datetime import date, timedelta

from celery import shared_task
from django.db.models import Q

logger = logging.getLogger(__name__)


@shared_task
def send_task_assigned_notification(task_id: str, actor_id: str) -> None:
    """
    Celery task: Gửi thông báo cho assignee khi được giao task.
    Chạy bất đồng bộ sau khi task được tạo hoặc cập nhật assignee.

    Args:
        task_id:  UUID string của Task.
        actor_id: UUID string của User thực hiện giao task.
    """
    from django.contrib.auth import get_user_model
    from apps.tasks.models import Task
    from .services import NotificationService

    User = get_user_model()

    try:
        task = Task.objects.select_related('assignee', 'project').get(id=task_id)
        actor = User.objects.get(id=actor_id)
        NotificationService.notify_task_assigned(task, actor)
        logger.info(f"send_task_assigned_notification: task_id={task_id}, actor_id={actor_id}")
    except Exception as exc:
        logger.error(
            f"send_task_assigned_notification failed: "
            f"task_id={task_id}, actor_id={actor_id}, error={exc}"
        )


@shared_task
def send_project_member_added_notification(project_id: str, new_member_id: str, actor_id: str) -> None:
    """
    Celery task: Gửi thông báo cho user khi được thêm vào dự án.

    Args:
        project_id:    UUID string của Project.
        new_member_id: UUID string của User vừa được thêm.
        actor_id:      UUID string của User thực hiện thêm (owner).
    """
    from django.contrib.auth import get_user_model
    from apps.projects.models import Project
    from .services import NotificationService

    User = get_user_model()

    try:
        project = Project.objects.get(id=project_id)
        new_member = User.objects.get(id=new_member_id)
        actor = User.objects.get(id=actor_id)
        NotificationService.notify_project_member_added(project, new_member, actor)
        logger.info(
            f"send_project_member_added_notification: "
            f"project_id={project_id}, member_id={new_member_id}, actor_id={actor_id}"
        )
    except Exception as exc:
        logger.error(
            f"send_project_member_added_notification failed: "
            f"project_id={project_id}, member_id={new_member_id}, error={exc}"
        )


@shared_task
def check_due_soon_tasks() -> None:
    """
    Celery periodic task: Quét tất cả task sắp đến hạn trong 24 giờ tới
    và tạo thông báo cho assignee.

    Chạy mỗi giờ một lần (cấu hình trong CELERY_BEAT_SCHEDULE).
    Chỉ xử lý task:
        - Có due_date = ngày mai (UTC)
        - Chưa hoàn thành (status != 'done')
        - Có assignee
    """
    from apps.tasks.models import Task
    from .services import NotificationService

    tomorrow = date.today() + timedelta(days=1)

    tasks = (
        Task.objects
        .filter(
            due_date=tomorrow,
            assignee__isnull=False,
        )
        .exclude(status='done')
        .select_related('assignee', 'project')
    )

    count = 0
    for task in tasks:
        try:
            NotificationService.notify_task_due_soon(task)
            count += 1
        except Exception as exc:
            logger.error(
                f"check_due_soon_tasks: failed for task_id={task.id}, error={exc}"
            )

    logger.info(f"check_due_soon_tasks: processed {count} tasks with due_date={tomorrow}")
