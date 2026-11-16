from typing import Any
from collections.abc import Mapping

from django.db.models import Q
from rest_framework import serializers

from apps.users.serializers import UserSerializer
from ..models import Conversation, Message


class CodeSnippetField(serializers.Field):
    default_error_messages = {
        'invalid': "Un extrait de code invalide a été fourni.",
        'language': "Langage invalide.",
        'code': "Le code doit contenir 1 à 20 000 caractères.",
    }

    def to_internal_value(self, data: object) -> dict[str, str]:
        if not isinstance(data, Mapping):
            self.fail('invalid')

        language = data.get('language', 'text')
        code = data.get('code', '')
        errors = {}
        if not isinstance(language, str) or len(language) > 40:
            errors['language'] = [self.error_messages['language']]
        if not isinstance(code, str) or not code.strip() or len(code) > 20000:
            errors['code'] = [self.error_messages['code']]
        if errors:
            raise serializers.ValidationError(errors)

        return {
            'kind': Message.Kind.CODE,
            'code_language': language,
            'code_content': code,
        }

    def to_representation(self, message: Message) -> dict[str, str] | None:
        if message.kind != Message.Kind.CODE:
            return None
        return {'language': message.code_language, 'code': message.code_content}


# Message srializer
class MessageSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    conversationId = serializers.CharField(source='conversation_id', read_only=True)
    sender = UserSerializer(read_only=True)
    type = serializers.ChoiceField(source='kind', choices=Message.Kind.choices, required=False)
    codeSnippet = CodeSnippetField(source='*', required=False)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    isRead = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'conversationId', 'sender', 'content', 'type', 'codeSnippet', 'createdAt', 'isRead']

    def get_isRead(self, message: Message) -> bool:
        return not message.conversation.participant_links.exclude(user_id=message.sender_id).filter(
            Q(last_read_at__isnull=True) | Q(last_read_at__lt=message.created_at)
        ).exists()
        
    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        content = attrs.get('content', '')
        code = attrs.get('code_content', '')
        if not content and not code:
            raise serializers.ValidationError({'content': ["Écrivez un message ou ajoutez un extrait de code."]})
        if code:
            attrs['kind'] = Message.Kind.CODE
            
        return attrs

    def create(self, validated_data: dict[str, Any]) -> Message:
        return Message.objects.create(**validated_data)


# Conversation serializer
class ConversationSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    type = serializers.CharField(source='kind', read_only=True)
    name = serializers.SerializerMethodField()
    participants = serializers.SerializerMethodField()
    lastMessage = serializers.SerializerMethodField()
    unreadCount = serializers.SerializerMethodField()
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)

    class Meta:
        model = Conversation
        fields = ['id', 'type', 'name', 'participants', 'lastMessage', 'unreadCount', 'updatedAt']

    def get_name(self, conversation: Conversation) -> str | None:
        return conversation.title or None

    def get_participants(self, conversation: Conversation) -> dict[str, Any]:
        request = self.context['request']
        users = [link.user for link in conversation.participant_links.all()]
        return UserSerializer(users, many=True, context={'request': request}).data

    def get_lastMessage(self, conversation: Conversation) -> dict[str, Any]:
        latest_messages = getattr(conversation, 'latest_messages', None)
        
        if latest_messages is not None:
            message = latest_messages[0] if latest_messages else None
        else:
            message = conversation.messages.select_related('sender', 'sender__profile').order_by('-created_at', '-pk').first()
            
        return MessageSerializer(message, context=self.context).data if message else None

    def get_unreadCount(self, conversation: Conversation) -> int:
        if hasattr(conversation, 'unread_count'):
            return conversation.unread_count

        request = self.context['request']
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