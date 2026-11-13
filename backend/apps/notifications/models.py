from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Type(models.TextChoices):
        COMMENT = "comment", "Commentaire"
        REACTION = "reaction", "Réaction"
        FOLLOW = "follow", "Abonnement"
        MESSAGE = "message", "Message"
        COLLAB_INVITE = "collab_invite", "Organisation"
        MENTION = "mention", "Mention"
        ISSUE_ASSIGNED = "issue_assigned", "Issue"
        PR_REVIEW = "pr_review", "Pull request"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_notifications",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_notifications",
    )
    kind = models.CharField(max_length=32, choices=Type.choices)
    message = models.CharField(max_length=500)
    target_url = models.CharField(max_length=500, default="/notifications")
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-pk"]
        indexes = [
            models.Index(fields=["recipient", "is_read", "created_at"], name="notif_user_read_date_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.kind} pour {self.recipient}"