from apps.notifications.models import Notification


def create_notification(*, recipient, actor, kind: str, message: str, target_url: str) -> Notification | None:
    if recipient.pk == actor.pk:
        return None
    return Notification.objects.create(
        recipient=recipient,
        actor=actor,
        kind=kind,
        message=message[:500],
        target_url=target_url[:500],
    )