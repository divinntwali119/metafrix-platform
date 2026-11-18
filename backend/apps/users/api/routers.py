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
from .views import (
    CurrentUserView,
    DeveloperDetailView,
    DeveloperFollowView,
    DeveloperListView,
)

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("social-accounts", SocialAccountViewSet, basename="social-account")
router.register("contact-emails", ContactEmailViewSet, basename="contact-email")
router.register("ignored-repositories", IgnoredRepoViewSet, basename="ignored-repository")

app_name = "users_api"
urlpatterns = [
    path("users/me/", CurrentUserView.as_view(), name="current-user"),
    path("developers/", DeveloperListView.as_view(), name="developer-list"),
    path(
        "developers/<str:username>/",
        DeveloperDetailView.as_view(),
        name="developer-detail",
    ),
    path(
        "developers/<str:username>/follow/",
        DeveloperFollowView.as_view(),
        name="developer-follow",
    ),
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