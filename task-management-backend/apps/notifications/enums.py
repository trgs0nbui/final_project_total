from django.db import models


class NotificationType(models.TextChoices):
    # Task events
    TASK_ASSIGNED = 'task_assigned', 'Được giao công việc'
    TASK_DUE_SOON = 'task_due_soon', 'Công việc sắp đến hạn'

    # Project events
    PROJECT_MEMBER_ADDED = 'project_member_added', 'Được thêm vào dự án'
