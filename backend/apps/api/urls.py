from django.urls import include, path
from views import HealthCheckView

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health'),
    path('auth/', include('apps.auth.urls')),
    path('', include('apps.users.api.routers')),
    path('', include('apps.collaborations.api.routers')),
    path('', include('apps.repositories.api.urls')),
    path('', include('apps.posts.api.urls')),
    path('', include('apps.notifications.api.urls')),
    path('', include('apps.messaging.api.urls')),
]
