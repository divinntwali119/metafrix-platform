from apps.notifications.models import Notification
from apps.users.models import User

def create_notification(*, recipient: User, actor: User, kind: str, message: str, target_url: str) -> Notification | None:
    if recipient.username == actor.username:
        return None
    return Notification.objects.create(
        recipient=recipient,
        actor=actor,
        kind=kind,
        message=message[:500],
        target_url=target_url[:500],
    )