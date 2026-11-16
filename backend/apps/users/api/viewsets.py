from django.db.models import QuerySet
from django.shortcuts import get_object_or_404
from rest_framework.mixins import (
    CreateModelMixin,
    DestroyModelMixin,
    ListModelMixin,
    RetrieveModelMixin,
    UpdateModelMixin,
)
from rest_framework.viewsets import GenericViewSet

from ..models import ContactEmail, IgnoredRepo, Profile, Settings, SocialAccount, User
from .permissions import (
    ContactEmailPerm,
    IgnoredRepoPerm,
    ProfilePerm,
    SettingsPerm,
    SocialAccountPerm,
    UserPerm,
)
from .serializers import (
    ContactEmailSerializer,
    IgnoredRepoSerializer,
    ProfileSerializer,
    SettingsSerializer,
    SocialAccountSerializer,
    UserSerializer,
)


class UserViewSet(GenericViewSet, RetrieveModelMixin, UpdateModelMixin):
    serializer_class = UserSerializer
    queryset = User.objects.all()
    permission_classes = [UserPerm]
    lookup_field = "username"

    def get_queryset(self) -> QuerySet[User]:
        return self.queryset.filter(pk=self.request.user.pk)


class ProfileViewSet(GenericViewSet, RetrieveModelMixin, UpdateModelMixin):
    serializer_class = ProfileSerializer
    queryset = Profile.objects.all()
    permission_classes = [ProfilePerm]

    def get_queryset(self) -> QuerySet[Profile]:
        return self.queryset.filter(user=self.request.user)

    def get_object(self) -> Profile:
        profile = get_object_or_404(self.get_queryset())
        self.check_object_permissions(self.request, profile)
        return profile


class SocialAccountViewSet(
    GenericViewSet,
    CreateModelMixin,
    ListModelMixin,
    RetrieveModelMixin,
    UpdateModelMixin,
    DestroyModelMixin,
):
    serializer_class = SocialAccountSerializer
    queryset = SocialAccount.objects.all()
    permission_classes = [SocialAccountPerm]

    def get_queryset(self) -> QuerySet[SocialAccount]:
        return self.queryset.filter(profile__user=self.request.user)

    def perform_create(self, serializer: SocialAccountSerializer) -> None:
        serializer.save(profile=self.request.user.profile)


class ContactEmailViewSet(
    GenericViewSet,
    CreateModelMixin,
    ListModelMixin,
    UpdateModelMixin,
    DestroyModelMixin,
):
    serializer_class = ContactEmailSerializer
    queryset = ContactEmail.objects.all()
    permission_classes = [ContactEmailPerm]

    def get_queryset(self) -> QuerySet[ContactEmail]:
        return self.queryset.filter(profile__user=self.request.user)

    def perform_create(self, serializer: ContactEmailSerializer) -> None:
        serializer.save(profile=self.request.user.profile)


class SettingsViewSet(GenericViewSet, RetrieveModelMixin, UpdateModelMixin):
    serializer_class = SettingsSerializer
    queryset = Settings.objects.all()
    permission_classes = [SettingsPerm]

    def get_queryset(self) -> QuerySet[Settings]:
        return self.queryset.filter(user=self.request.user)

    def get_object(self) -> Settings:
        settings = get_object_or_404(self.get_queryset())
        self.check_object_permissions(self.request, settings)
        return settings


class IgnoredRepoViewSet(
    GenericViewSet,
    CreateModelMixin,
    ListModelMixin,
    UpdateModelMixin,
    DestroyModelMixin,
):
    serializer_class = IgnoredRepoSerializer
    queryset = IgnoredRepo.objects.all()
    permission_classes = [IgnoredRepoPerm]

    def get_queryset(self) -> QuerySet[IgnoredRepo]:
        return self.queryset.filter(user_settings__user=self.request.user)

    def perform_create(self, serializer: IgnoredRepoSerializer) -> None:
        serializer.save(user_settings=self.request.user.setting)
