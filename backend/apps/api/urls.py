from django.urls import include, path

urlpatterns = [
    path("", include("apps.auth.urls")),
    path("", include("apps.users.api.routers")),
    path("", include("apps.collaborations.api.routers")),
    path("", include("apps.repositories.urls")),
    path("", include("apps.notifications.api.urls")),
]
