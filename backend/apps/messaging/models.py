from uuid import uuid4
from django.conf import settings
from django.db import models


class Conversation(models.Model):
    class Kind(models.TextChoices):
        DIRECT = 'direct', "Directe"
        GROUP = 'group', "Groupe"

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.DIRECT)
    title = models.CharField(max_length=120, blank=True, default='')
    direct_key = models.CharField(max_length=310, unique=True, null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at', '-created_at']


class ConversationParticipant(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='participant_links')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='conversation_links')
    joined_at = models.DateTimeField(auto_now_add=True)
    last_read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['joined_at', 'pk']
        constraints = [
            models.UniqueConstraint(fields=['conversation', 'user'], name='unique_conversation_participant'),
        ]


class Message(models.Model):
    class Kind(models.TextChoices):
        TEXT = 'text', "Texte"
        CODE = 'code', "Code"

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='messages_sent')
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.TEXT)
    content = models.CharField(max_length=5000, blank=True, default='')
    code_language = models.CharField(max_length=40, blank=True, default='')
    code_content = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at', 'pk']
        indexes = [
            models.Index(fields=['conversation', 'created_at'], name='message_convo_date_idx')
        ]