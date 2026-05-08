from rest_framework import serializers

from apps.users.serializers import UserSerializer
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer cho Notification.
    Trả về thông tin đầy đủ bao gồm actor (nested read-only).
    """

    actor = UserSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id',
            'notification_type',
            'title',
            'message',
            'actor',
            'project_id',
            'task_id',
            'is_read',
            'created_at',
        ]
        read_only_fields = fields
