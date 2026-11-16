from django.urls import path
from rest_framework.routers import DefaultRouter

from .viewsets import (
    ContactEmailViewSet,
    IgnoredRepoViewSet,
    ProfileViewSet,
    SettingsViewSet,
    SocialAccountViewSet,
    UserViewSet,
)

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("social-accounts", SocialAccountViewSet, basename="social-account")
router.register("contact-emails", ContactEmailViewSet, basename="contact-email")
router.register("ignored-repositories", IgnoredRepoViewSet, basename="ignored-repository")

app_name = "users_api"
urlpatterns = [
    path(
        "profile/",
        ProfileViewSet.as_view(
            {"get": "retrieve", "put": "update", "patch": "partial_update"}
        ),
        name="profile",
    ),
    path(
        "settings/",
        SettingsViewSet.as_view(
            {"get": "retrieve", "put": "update", "patch": "partial_update"}
        ),
        name="settings",
    ),
    *router.urls,
]