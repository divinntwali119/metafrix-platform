from rest_framework.permissions import SAFE_METHODS, BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView


class IsAuthenticatedForWrite(BasePermission):
    def has_permission(self, request: Request, _view: APIView) -> bool:
        return request.method == "GET" or bool(
            request.user and request.user.is_authenticated
        )


class IsPostOwner(BasePermission):
    def has_object_permission(self, request: Request, _view: APIView, obj: object) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(obj, "posted_by_id", None) == request.user.pk
        )


class IsEventOrganisator(BasePermission):
    def has_object_permission(self, request: Request, _view: APIView, obj: object) -> bool:
        if request.method in SAFE_METHODS:
            return True
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(obj, "organisator_id", None) == request.user.pk
        )


class IsReelOwner(BasePermission):
    def has_object_permission(self, request: Request, _view: APIView, obj: object) -> bool:
        if request.method in SAFE_METHODS:
            return True
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(obj, "posted_by_id", None) == request.user.pk
        )