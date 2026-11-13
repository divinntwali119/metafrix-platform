from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.db.models import Count, OuterRef, Prefetch, Q, Subquery
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.services import create_notification
from .models import Conversation, ConversationParticipant, Message
from .serializers import ConversationSerializer, MessageCreateSerializer, MessageSerializer

User = get_user_model()


def conversation_for_user(conversation_id, user):
    return get_object_or_404(
        Conversation.objects.prefetch_related("participant_links__user__profile"),
        pk=conversation_id,
        participant_links__user=user,
    )


class ConversationListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        own_participant = ConversationParticipant.objects.filter(
            conversation_id=OuterRef("pk"), user=request.user
        )
        conversations = Conversation.objects.filter(
            participant_links__user=request.user
        ).annotate(
            unread_count=Count(
                "messages",
                filter=~Q(messages__sender=request.user)
                & (
                    Q(messages__conversation__participant_links__user=request.user,
                      messages__conversation__participant_links__last_read_at__isnull=True)
                    | Q(messages__conversation__participant_links__user=request.user,
                        messages__created_at__gt=Subquery(own_participant.values("last_read_at")[:1]))
                ),
                distinct=True,
            ),
        ).select_related("created_by").prefetch_related(
            "participant_links__user__profile",
            "messages__sender__profile",
            Prefetch(
                "messages",
                queryset=Message.objects.select_related("sender", "sender__profile").order_by(
                    "-created_at", "-pk"
                )[:1],
                to_attr="latest_messages",
            ),
        ).distinct().order_by("-updated_at", "-pk")
        return Response(ConversationSerializer(conversations, many=True, context={"request": request}).data)

    def post(self, request):
        title = str(request.data.get("name", "")).strip()
        usernames = request.data.get("usernames", [])
        if not title or len(title) > 120 or not isinstance(usernames, list) or not 1 <= len(usernames) <= 19:
            return Response({"detail": "Un nom de groupe et 1 à 19 autres membres sont requis."}, status=400)
        users = list(User.objects.filter(username__in=usernames, is_active=True).exclude(pk=request.user.pk))
        if len({user.username for user in users}) != len(set(usernames)):
            return Response({"usernames": ["Un ou plusieurs comptes sont introuvables."]}, status=400)
        with transaction.atomic():
            conversation = Conversation.objects.create(kind=Conversation.Kind.GROUP, title=title, created_by=request.user)
            ConversationParticipant.objects.bulk_create(
                [ConversationParticipant(conversation=conversation, user=user) for user in [request.user, *users]]
            )
        conversation = Conversation.objects.prefetch_related("participant_links__user__profile").get(pk=conversation.pk)
        return Response(ConversationSerializer(conversation, context={"request": request}).data, status=201)


class DirectConversationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        username = str(request.data.get("username", "")).strip()
        target = User.objects.filter(username__iexact=username, is_active=True).first()
        if target is None:
            return Response({"detail": "Ce compte est introuvable."}, status=404)
        if target.pk == request.user.pk:
            return Response({"detail": "Vous ne pouvez pas démarrer une conversation avec vous-même."}, status=400)
        low, high = sorted((str(request.user.pk), str(target.pk)))
        key = f"{low}:{high}"
        try:
            with transaction.atomic():
                conversation, _ = Conversation.objects.get_or_create(
                    direct_key=key,
                    defaults={"kind": Conversation.Kind.DIRECT, "created_by": request.user},
                )
                ConversationParticipant.objects.get_or_create(conversation=conversation, user=request.user)
                ConversationParticipant.objects.get_or_create(conversation=conversation, user=target)
        except IntegrityError:
            conversation = Conversation.objects.get(direct_key=key)
        conversation = Conversation.objects.prefetch_related("participant_links__user__profile").get(pk=conversation.pk)
        return Response(ConversationSerializer(conversation, context={"request": request}).data)


class ConversationMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, conversation_id):
        conversation = conversation_for_user(conversation_id, request.user)
        ConversationParticipant.objects.filter(conversation=conversation, user=request.user).update(
            last_read_at=timezone.now()
        )
        messages = list(
            conversation.messages.select_related("sender", "sender__profile")
            .order_by("-created_at", "-pk")[:100]
        )
        messages.reverse()
        return Response(MessageSerializer(messages, many=True, context={"request": request}).data)

    def post(self, request, conversation_id):
        conversation = conversation_for_user(conversation_id, request.user)
        serializer = MessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            kind=data["type"],
            content=data.get("content", ""),
            code_language=data.get("code_language", ""),
            code_content=data.get("code_content", ""),
        )
        conversation.save(update_fields=["updated_at"])
        preview = message.content or "vous a envoyé un extrait de code"
        for participant in conversation.participant_links.select_related("user").exclude(user=request.user):
            create_notification(
                recipient=participant.user,
                actor=request.user,
                kind="message",
                message=f"vous a envoyé un message : {preview[:120]}",
                target_url=f"/messages?conversation={conversation.pk}",
            )
        message = Message.objects.select_related("sender", "sender__profile").get(pk=message.pk)
        return Response(MessageSerializer(message, context={"request": request}).data, status=status.HTTP_201_CREATED)