from django.urls import include, path

from .views import HealthCheckView

app_name = 'api'
urlpatterns = [
	path("health/", HealthCheckView.as_view(), name="health-check"),
	path("", include("apps.users.urls")),
	path("", include("apps.repositories.urls")),
	path("", include("apps.posts.urls")),
	path("", include("apps.collaborations.urls")),
	path("", include("apps.messaging.urls")),
	path("", include("apps.notifications.urls")),
]