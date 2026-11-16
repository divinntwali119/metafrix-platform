from django.urls import include, path

from .views import (
	CurrentUserView,
	DeveloperDetailView,
	DeveloperFollowView,
	DeveloperListView,
)

app_name = 'users'
urlpatterns = [
	path("users/me/", CurrentUserView.as_view(), name="current-user"),
	path("developers/", DeveloperListView.as_view(), name="developer-list"),
	path("developers/<str:username>/", DeveloperDetailView.as_view(), name="developer-detail"),
	path("developers/<str:username>/follow/", DeveloperFollowView.as_view(), name="developer-follow"),
]