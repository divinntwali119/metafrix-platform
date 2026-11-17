from django.http import HttpRequest
from django.db.models import Model

from rest_framework.permissions import BasePermission, SAFE_METHODS
from rest_framework.generics import GenericAPIView

from ..models import Profile, Settings, SocialAccount

class IsOwner(BasePermission):
    lookup_obj_field : str | None = None
    lookup_owener_field : str | None = None
    
    def has_permission(self, request : HttpRequest, view : GenericAPIView) -> bool:
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request : HttpRequest, view : GenericAPIView, obj : Model) -> bool:
        return (
            sum([True if not self.lookup_field else hasattr(obj, lookup_field) and obj.__getattribute__(lookup_field).id == request.user.id  for lookup_field in self.lookup_fields])
        )

class IsOwnerOrReadOnly(IsOwner):
    def has_permission(self, request : HttpRequest, view : GenericAPIView) -> bool:
        return request.method in SAFE_METHODS or super().has_permission(request, view)
    
    def has_object_permission(self, request : HttpRequest, view : GenericAPIView, obj : Model) -> bool:
        return request.method in SAFE_METHODS or super().has_object_permission(request, view, obj)