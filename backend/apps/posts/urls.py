from django.urls import path

from .views import PostBookmarkView, PostCommentsView, PostDetailView, PostLikeView, PostListCreateView

app_name = "posts"
urlpatterns = [
    path("posts/", PostListCreateView.as_view(), name="post-list"),
    path("posts/<int:post_id>/", PostDetailView.as_view(), name="post-detail"),
    path("posts/<int:post_id>/comments/", PostCommentsView.as_view(), name="post-comments"),
    path("posts/<int:post_id>/like/", PostLikeView.as_view(), name="post-like"),
    path("posts/<int:post_id>/bookmark/", PostBookmarkView.as_view(), name="post-bookmark"),
]