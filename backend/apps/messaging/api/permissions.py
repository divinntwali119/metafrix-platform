from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.views import APIView

from ..models import Conversation, ConversationParticipant


class ConversationParticipantPermission(IsAuthenticated):
    def has_object_permission(
        self,
        request: Request,
        _view: APIView,
        conversation: Conversation,
    ) -> bool:
        if not ConversationParticipant.objects.filter(
            conversation=conversation,
            user=request.user,
        ).exists():
            raise NotFound
        return True
