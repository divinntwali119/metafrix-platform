from django.db import models
from django.conf import settings


class ExternalIdentity(models.Model):
    class Provider(models.TextChoices):
        GOOGLE = "google", "Google"
        MICROSOFT = "microsoft", "Microsoft"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="external_identities",
    )
    provider = models.CharField(max_length=20, choices=Provider.choices)
    subject = models.CharField(max_length=255)
    email = models.EmailField(max_length=254)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "users_externalidentity"
        constraints = [
            models.UniqueConstraint(fields=["provider", "subject"], name="unique_external_identity_subject"),
            models.UniqueConstraint(fields=["user", "provider"], name="unique_external_identity_provider_per_user"),
        ]


class EmailVerificationToken(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="email_verification_tokens",
    )
    email = models.EmailField(max_length=254)
    token_hash = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "users_emailverificationtoken"
        indexes = [models.Index(fields=["user", "used_at"], name="email_verify_user_used_idx")]
