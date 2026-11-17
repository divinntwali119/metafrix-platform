from django.urls import path

from .views import (
    IssueListCreateView,
    PullRequestListCreateView,
    RepositoryBlobView,
    RepositoryBranchesView,
    RepositoryCommitsView,
    RepositoryDetailView,
    RepositoryListCreateView,
    RepositoryMetadataView,
    RepositoryStarView,
    RepositoryTreeView,
    RepositoryWatchView,
)

app_name = "repositories"
urlpatterns = [
    path("repositories/", RepositoryListCreateView.as_view(), name="repository-list-create"),
    path("repositories/<int:repository_id>/", RepositoryMetadataView.as_view(), name="repository-metadata"),
    path("repositories/<int:repository_id>/branches/", RepositoryBranchesView.as_view(), name="repository-branches"),
    path("repositories/<int:repository_id>/tree/", RepositoryTreeView.as_view(), name="repository-tree"),
    path("repositories/<int:repository_id>/blob/", RepositoryBlobView.as_view(), name="repository-blob"),
    path("repositories/<int:repository_id>/commits/", RepositoryCommitsView.as_view(), name="repository-commits"),
    path("repositories/<int:repository_id>/star/", RepositoryStarView.as_view(), name="repository-star"),
    path("repositories/<int:repository_id>/watch/", RepositoryWatchView.as_view(), name="repository-watch"),
    path("repositories/<int:repository_id>/issues/", IssueListCreateView.as_view(), name="repository-issues"),
    path("repositories/<int:repository_id>/pulls/", PullRequestListCreateView.as_view(), name="repository-pull-requests"),
    path("repositories/<str:owner>/<str:name>/", RepositoryDetailView.as_view(), name="repository-detail"),
]
