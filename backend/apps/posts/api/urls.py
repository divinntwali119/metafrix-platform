from django.urls import path

from .views import (
    EventDetailView,
    EventListCreateView,
    PostBookmarkView,
    PostCommentsView,
    PostDetailView,
    PostLikeView,
    PostListCreateView,
    ReelCommentsView,
    ReelDetailView,
    ReelListCreateView,
)

app_name = "posts"
urlpatterns = [
    path("posts/", PostListCreateView.as_view(), name="post-list"),
    path("posts/<uuid:post_id>/", PostDetailView.as_view(), name="post-detail"),
    path("posts/<uuid:post_id>/comments/", PostCommentsView.as_view(), name="post-comments"),
    path("posts/<uuid:post_id>/like/", PostLikeView.as_view(), name="post-like"),
    path("posts/<uuid:post_id>/bookmark/", PostBookmarkView.as_view(), name="post-bookmark"),
    path("events/", EventListCreateView.as_view(), name="event-list"),
    path("events/<uuid:event_id>/", EventDetailView.as_view(), name="event-detail"),
    path("reels/", ReelListCreateView.as_view(), name="reel-list"),
    path("reels/<uuid:reel_id>/", ReelDetailView.as_view(), name="reel-detail"),
    path("reels/<uuid:reel_id>/comments/", ReelCommentsView.as_view(), name="reel-comments"),
]