from django.db import transaction

from .models import ContactEmail, Profile, Settings, User


@transaction.atomic
def register_user(validated_data: dict[str, str]) -> User:
    registration_data = validated_data.copy()
    name_parts = registration_data.pop("name").split(maxsplit=1)
    user = User.objects.create_user(
        **registration_data,
        first_name=name_parts[0],
        last_name=name_parts[1] if len(name_parts) > 1 else "",
        expertise_domain=User.Domain.OTHER,
        is_active=False,
        is_email_verified=False,
    )
    profile = Profile.objects.create(user=user)
    primary_email = ContactEmail.objects.create(
        profile=profile,
        email=user.email,
        type=ContactEmail.Type.PRIMARY,
    )
    Settings.objects.create(
        user=user,
        default_notif_email=primary_email,
        voice_commander_shortcut="Alt+K",
        watching_repos=Settings.NotifyMeOn.METAFRIX,
        following_users=Settings.NotifyMeOn.METAFRIX,
        mentions=Settings.NotifyMeOn.METAFRIX,
        invitations=Settings.NotifyMeOn.METAFRIX,
        recruting=Settings.NotifyMeOn.METAFRIX,
        security_alerts_notif=user.email,
    )
    return user