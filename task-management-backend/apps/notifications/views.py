import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from apps.common.pagination import CustomPageNumberPagination
from .services import NotificationService
from .serializers import NotificationSerializer

logger = logging.getLogger(__name__)


class NotificationListView(APIView):
    """
    GET /api/notifications/

    Trả về danh sách thông báo của user hiện tại, mới nhất trước.

    Query params:
        unread (bool, optional): Nếu "true", chỉ trả về thông báo chưa đọc.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        unread_only = request.query_params.get('unread', '').lower() == 'true'
        notifications = NotificationService.get_notifications(request.user, unread_only=unread_only)

        paginator = CustomPageNumberPagination()
        page = paginator.paginate_queryset(notifications, request)
        serializer = NotificationSerializer(page, many=True)

        logger.debug(
            f"NotificationListView.get: user_id={request.user.id}, "
            f"unread_only={unread_only}"
        )
        return paginator.get_paginated_response(serializer.data)


class NotificationUnreadCountView(APIView):
    """
    GET /api/notifications/unread-count/

    Trả về số lượng thông báo chưa đọc của user hiện tại.
    Dùng để hiển thị badge trên icon chuông ở navbar.

    Response: { "count": <int> }
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = NotificationService.get_unread_count(request.user)
        logger.debug(
            f"NotificationUnreadCountView.get: user_id={request.user.id}, count={count}"
        )
        return Response({'count': count}, status=status.HTTP_200_OK)


class NotificationMarkReadView(APIView):
    """
    PATCH /api/notifications/<pk>/read/

    Đánh dấu một thông báo cụ thể là đã đọc.
    Chỉ cho phép đánh dấu thông báo của chính user.
    """

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        notification = NotificationService.mark_as_read(request.user, pk)
        logger.info(
            f"NotificationMarkReadView.patch: "
            f"notification_id={pk}, user_id={request.user.id}"
        )
        return Response(NotificationSerializer(notification).data, status=status.HTTP_200_OK)


class NotificationMarkAllReadView(APIView):
    """
    POST /api/notifications/mark-all-read/

    Đánh dấu tất cả thông báo chưa đọc của user là đã đọc.

    Response: { "updated": <int> }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        count = NotificationService.mark_all_as_read(request.user)
        logger.info(
            f"NotificationMarkAllReadView.post: "
            f"user_id={request.user.id}, updated={count}"
        )
        return Response({'updated': count}, status=status.HTTP_200_OK)
