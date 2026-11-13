from django.db.models import Q
from rest_framework import serializers

from apps.users.serializers import UserSerializer
from .models import Conversation, ConversationParticipant, Message


class MessageSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    conversationId = serializers.CharField(source="conversation_id", read_only=True)
    sender = UserSerializer(read_only=True)
    type = serializers.CharField(source="kind", read_only=True)
    codeSnippet = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    isRead = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ["id", "conversationId", "sender", "content", "type", "codeSnippet", "createdAt", "isRead"]

    def get_codeSnippet(self, message: Message):
        if message.kind != Message.Kind.CODE:
            return None
        return {"language": message.code_language, "code": message.code_content}

    def get_isRead(self, message: Message) -> bool:
        return not message.conversation.participant_links.exclude(user_id=message.sender_id).filter(
            Q(last_read_at__isnull=True) | Q(last_read_at__lt=message.created_at)
        ).exists()


class MessageCreateSerializer(serializers.Serializer):
    content = serializers.CharField(max_length=5000, allow_blank=True, required=False, trim_whitespace=True)
    type = serializers.ChoiceField(choices=Message.Kind.choices, default=Message.Kind.TEXT)
    codeSnippet = serializers.DictField(required=False)

    def validate(self, attrs):
        content = attrs.get("content", "")
        code = attrs.get("codeSnippet")
        if not content and not code:
            raise serializers.ValidationError({"content": ["Écrivez un message ou ajoutez un extrait de code."]})
        if code is not None:
            language = code.get("language", "text")
            snippet = code.get("code", "")
            if not isinstance(language, str) or len(language) > 40:
                raise serializers.ValidationError({"codeSnippet": ["Langage invalide."]})
            if not isinstance(snippet, str) or not snippet.strip() or len(snippet) > 20000:
                raise serializers.ValidationError({"codeSnippet": ["Le code doit contenir 1 à 20 000 caractères."]})
            attrs["code_language"] = language
            attrs["code_content"] = snippet
            attrs["type"] = Message.Kind.CODE
        return attrs


class ConversationSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    type = serializers.CharField(source="kind", read_only=True)
    name = serializers.SerializerMethodField()
    participants = serializers.SerializerMethodField()
    lastMessage = serializers.SerializerMethodField()
    unreadCount = serializers.SerializerMethodField()
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Conversation
        fields = ["id", "type", "name", "participants", "lastMessage", "unreadCount", "updatedAt"]

    def get_name(self, conversation: Conversation):
        return conversation.title or None

    def get_participants(self, conversation: Conversation):
        request = self.context["request"]
        users = [link.user for link in conversation.participant_links.all()]
        return UserSerializer(users, many=True, context={"request": request}).data

    def get_lastMessage(self, conversation: Conversation):
        latest_messages = getattr(conversation, "latest_messages", None)
        if latest_messages is not None:
            message = latest_messages[0] if latest_messages else None
        else:
            message = conversation.messages.select_related("sender", "sender__profile").order_by("-created_at", "-pk").first()
        return MessageSerializer(message, context=self.context).data if message else None

    def get_unreadCount(self, conversation: Conversation):
        if hasattr(conversation, "unread_count"):
            return conversation.unread_count
        request = self.context["request"]
        participant = next(
            (link for link in conversation.participant_links.all() if link.user_id == request.user.pk),
            None,
        )
        if participant is None:
            return 0
        queryset = conversation.messages.exclude(sender_id=request.user.pk)
        if participant.last_read_at:
            queryset = queryset.filter(created_at__gt=participant.last_read_at)
        return queryset.count()