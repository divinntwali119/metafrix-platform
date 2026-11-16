from rest_framework import serializers

from apps.users.api.serializers import UserSerializer
from ..models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    type = serializers.CharField(source="kind", read_only=True)
    actor = UserSerializer(read_only=True)
    targetUrl = serializers.CharField(source="target_url", read_only=True)
    isRead = serializers.BooleanField(source="is_read", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Notification
        fields = ["id", "type", "actor", "message", "targetUrl", "isRead", "createdAt"]
