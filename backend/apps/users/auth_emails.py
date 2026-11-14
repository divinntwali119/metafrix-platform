import hashlib
import logging
import secrets
from datetime import timedelta
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from .models import EmailVerificationToken, User

logger = logging.getLogger(__name__)


def send_verification_email(user: User) -> bool:
    raw_token = secrets.token_urlsafe(32)
    now = timezone.now()
    EmailVerificationToken.objects.filter(user=user, used_at__isnull=True).update(used_at=now)
    EmailVerificationToken.objects.create(
        user=user,
        email=user.email,
        token_hash=hashlib.sha256(raw_token.encode("utf-8")).hexdigest(),
        expires_at=now + timedelta(hours=24),
    )

    query = urlencode({"token": raw_token})
    verification_url = f"{settings.APP_BASE_URL.rstrip('/')}/verify-email?{query}"
    return _send_auth_email(
        subject="Confirmez votre adresse e-mail MetafriX",
        message=(
            f"Bonjour {user.get_full_name().strip() or user.username},\n\n"
            "Confirmez votre adresse e-mail pour activer votre compte MetafriX :\n"
            f"{verification_url}\n\n"
            "Ce lien expire dans 24 heures. Si vous n’êtes pas à l’origine de cette demande, ignorez ce message."
        ),
        recipient=user.email,
        mail_kind="verification",
    )


def send_password_reset_email(user: User) -> bool:
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    query = urlencode({"uid": uid, "token": token})
    reset_url = f"{settings.APP_BASE_URL.rstrip('/')}/reset-password?{query}"
    return _send_auth_email(
        subject="Réinitialisation de votre mot de passe MetafriX",
        message=(
            "Une demande de réinitialisation du mot de passe a été reçue pour votre compte MetafriX.\n\n"
            f"Choisissez un nouveau mot de passe dans l’heure :\n{reset_url}\n\n"
            "Si vous n’êtes pas à l’origine de cette demande, ignorez ce message."
        ),
        recipient=user.email,
        mail_kind="password reset",
    )


def _send_auth_email(*, subject: str, message: str, recipient: str, mail_kind: str) -> bool:
    try:
        return send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=False,
        ) == 1
    except Exception:
        logger.exception("MetafriX authentication email delivery failed (%s).", mail_kind)
        return False