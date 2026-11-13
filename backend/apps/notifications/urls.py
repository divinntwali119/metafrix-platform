from django.urls import path

from .views import NotificationDetailView, NotificationListView, NotificationReadAllView

app_name = "notifications"
urlpatterns = [
    path("notifications/", NotificationListView.as_view(), name="notification-list"),
    path("notifications/read-all/", NotificationReadAllView.as_view(), name="notification-read-all"),
    path("notifications/<int:notification_id>/", NotificationDetailView.as_view(), name="notification-detail"),
]