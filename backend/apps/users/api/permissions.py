from django.db.models import Model
from rest_framework.permissions import SAFE_METHODS, BasePermission
from rest_framework.request import Request
from rest_framework.generics import GenericAPIView

from ..models import ContactEmail, IgnoredRepo, SocialAccount


class IsOwner(BasePermission):
    lookup_fields: tuple[str, ...] = ()

    def has_permission(self, request: Request, _view: GenericAPIView) -> bool:
        return bool(request.user and request.user.is_authenticated)

    def is_owner(self, request: Request, obj: Model) -> bool:
        return any(
            getattr(obj, lookup_field, None) == request.user
            for lookup_field in self.lookup_fields
        )

    def has_object_permission(
        self,
        request: Request,
        _view: GenericAPIView,
        obj: Model,
    ) -> bool:
        return self.is_owner(request, obj)


class IsOwnerOrReadOnly(IsOwner):
    def has_object_permission(
        self,
        request: Request,
        view: GenericAPIView,
        obj: Model,
    ) -> bool:
        return request.method in SAFE_METHODS or super().has_object_permission(
            request,
            view,
            obj,
        )


class UserPerm(IsOwner):
    def is_owner(self, request: Request, obj: Model) -> bool:
        return request.user.is_authenticated and obj.pk == request.user.pk


class ProfilePerm(IsOwner):
    lookup_fields = ("user",)


class ContactEmailPerm(IsOwner):
    def is_owner(self, request: Request, obj: ContactEmail) -> bool:
        return (
            request.user.is_authenticated
            and obj.profile.user_id == request.user.pk
        )


class SocialAccountPerm(IsOwner):
    def is_owner(self, request: Request, obj: SocialAccount) -> bool:
        return (
            request.user.is_authenticated
            and obj.profile.user_id == request.user.pk
        )


class SettingsPerm(IsOwner):
    lookup_fields = ("user",)


class IgnoredRepoPerm(IsOwner):
    def is_owner(self, request: Request, obj: IgnoredRepo) -> bool:
        return (
            request.user.is_authenticated
            and obj.user_settings.user_id == request.user.pk
        )
