from django.shortcuts import get_object_or_404
from django.http import HttpRequest
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Notification
from .serializers import NotificationSerializer


class NotificationPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 100


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: HttpRequest) -> Response:
        queryset = Notification.objects.filter(recipient=request.user).select_related(
            "actor", "actor__profile"
        )
        unread = request.query_params.get("unread")
        if unread == "true":
            queryset = queryset.filter(is_read=False)
        paginator = NotificationPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        return paginator.get_paginated_response(
            NotificationSerializer(page, many=True, context={"request": request}).data
        )


class NotificationReadAllView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: HttpRequest) -> Response:
        updated = Notification.objects.filter(recipient=request.user, is_read=False).update(
            is_read=True
        )
        return Response({"updated": updated})


class NotificationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request: HttpRequest, notification_id: int) -> Response:
        notification = get_object_or_404(
            Notification, pk=notification_id, recipient=request.user
        )
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response(NotificationSerializer(notification, context={"request": request}).data)

    def delete(self, request: HttpRequest, notification_id: int) -> Response:
        notification = get_object_or_404(
            Notification, pk=notification_id, recipient=request.user
        )
        notification.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)