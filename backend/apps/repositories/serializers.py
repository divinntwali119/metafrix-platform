import re
from collections.abc import Mapping

from rest_framework import serializers

from apps.users.serializers import UserSerializer
from .models import (
    Fork,
    Issue,
    IssueAttachment,
    PullRequest,
    Repository,
    RepositorySettings,
    Star,
    Watcher,
)


class RepositoryAccessField(serializers.Field):
    def to_representation(self, value: str) -> bool:
        return value == Repository.Access.PRIVATE

    def to_internal_value(self, data: object) -> str:
        if not isinstance(data, bool):
            raise serializers.ValidationError("isPrivate doit être un booléen.")
        return Repository.Access.PRIVATE if data else Repository.Access.PUBLIC


class RepositorySerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    owner = UserSerializer(read_only=True)
    isPrivate = RepositoryAccessField(source="access", required=False, default=False)
    defaultBranch = serializers.CharField(source="default_branch", read_only=True)
    starsCount = serializers.SerializerMethodField()
    forksCount = serializers.SerializerMethodField()
    watchersCount = serializers.SerializerMethodField()
    isStarred = serializers.SerializerMethodField()
    isWatching = serializers.SerializerMethodField()
    issuesCount = serializers.SerializerMethodField()
    pullsCount = serializers.SerializerMethodField()
    languageColor = serializers.CharField(source="language_color", read_only=True)
    initializeReadme = serializers.BooleanField(write_only=True, required=False, default=True)
    size = serializers.SerializerMethodField()
    license = serializers.CharField(source="license_template", allow_null=True, required=False)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Repository
        fields = [
            "id",
            "name",
            "owner",
            "description",
            "isPrivate",
            "defaultBranch",
            "starsCount",
            "forksCount",
            "watchersCount",
            "isStarred",
            "isWatching",
            "issuesCount",
            "pullsCount",
            "language",
            "languageColor",
            "size",
            "license",
            "topics",
            "initializeReadme",
            "createdAt",
            "updatedAt",
        ]
        read_only_fields = [
            "id",
            "owner",
            "defaultBranch",
            "starsCount",
            "forksCount",
            "watchersCount",
            "issuesCount",
            "pullsCount",
            "languageColor",
            "size",
            "createdAt",
            "updatedAt",
        ]

    def validate_name(self, value: str) -> str:
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,119}", value) or ".." in value:
            raise serializers.ValidationError(
                "Utilisez 1 à 120 caractères alphanumériques, points, tirets ou underscores."
            )
        return value

    def validate_topics(self, value: list[str]) -> list[str]:
        if len(value) > 20 or any(not isinstance(topic, str) or len(topic) > 40 for topic in value):
            raise serializers.ValidationError("Limite : 20 sujets de 40 caractères maximum.")
        return [topic.strip() for topic in value if topic.strip()]

    def create(self, validated_data: dict) -> Repository:
        repository_data = validated_data.copy()
        repository_data.pop("initializeReadme", None)
        return Repository.objects.create(**repository_data)

    def get_starsCount(self, repository: Repository) -> int:
        return getattr(repository, "stars_count", None) if hasattr(repository, "stars_count") else repository.stars.count()

    def get_forksCount(self, repository: Repository) -> int:
        return getattr(repository, "forks_count", None) if hasattr(repository, "forks_count") else repository.forks.count()

    def get_watchersCount(self, repository: Repository) -> int:
        return getattr(repository, "watchers_count", None) if hasattr(repository, "watchers_count") else repository.watchers.count()

    def get_issuesCount(self, repository: Repository) -> int:
        return getattr(repository, "issues_count", None) if hasattr(repository, "issues_count") else repository.issues.count()

    def get_pullsCount(self, repository: Repository) -> int:
        return getattr(repository, "pulls_count", None) if hasattr(repository, "pulls_count") else repository.pull_requests.count()

    def get_isStarred(self, repository: Repository) -> bool:
        if hasattr(repository, "viewer_is_starred"):
            return repository.viewer_is_starred
        request = self.context.get("request")
        return bool(
            request
            and request.user.is_authenticated
            and repository.stars.filter(starred_by=request.user).exists()
        )

    def get_isWatching(self, repository: Repository) -> bool:
        if hasattr(repository, "viewer_is_watching"):
            return repository.viewer_is_watching
        request = self.context.get("request")
        return bool(
            request
            and request.user.is_authenticated
            and repository.watchers.filter(watched_by=request.user).exists()
        )

    def get_size(self, repository: Repository) -> str:
        size = repository.size_bytes
        if size < 1024:
            return f"{size} B"
        if size < 1024 * 1024:
            return f"{size / 1024:.1f} KB"
        return f"{size / (1024 * 1024):.1f} MB"


class RepositoryMetadataSerializer(serializers.ModelSerializer):
    isPrivate = RepositoryAccessField(source="access", required=False)

    class Meta:
        model = Repository
        fields = ["description", "isPrivate"]

    def to_internal_value(self, data: object) -> dict:
        if isinstance(data, Mapping):
            unknown_fields = set(data.keys()) - set(self.fields)
            if unknown_fields:
                raise serializers.ValidationError(
                    {field: ["Ce champ n’est pas modifiable via cette route."] for field in unknown_fields}
                )
        return super().to_internal_value(data)


class RepositorySettingsSerializer(serializers.ModelSerializer):
    defaultBranch = serializers.CharField(source="default_branch")
    issuesEnabled = serializers.BooleanField(source="issues_enabled")
    pullRequestsEnabled = serializers.BooleanField(source="pull_requests_enabled")
    requirePullRequestReviews = serializers.BooleanField(source="require_pull_request_reviews")
    requiredApprovals = serializers.IntegerField(source="required_approvals")
    deleteBranchAfterMerge = serializers.BooleanField(source="delete_branch_after_merge")
    allowForcePushes = serializers.BooleanField(source="allow_force_pushes")
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = RepositorySettings
        fields = [
            "defaultBranch",
            "issuesEnabled",
            "pullRequestsEnabled",
            "merge_strategy",
            "requirePullRequestReviews",
            "requiredApprovals",
            "deleteBranchAfterMerge",
            "allowForcePushes",
            "updatedAt",
        ]


class IssueSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    repositoryId = serializers.CharField(source="repo_id", read_only=True)
    number = serializers.IntegerField(source="relative_id", read_only=True)
    body = serializers.CharField(source="description")
    author = UserSerializer(source="submitted_by", read_only=True)
    assignees = serializers.SerializerMethodField()
    commentsCount = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="submitted_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="submitted_at", read_only=True)

    class Meta:
        model = Issue
        fields = [
            "id",
            "repositoryId",
            "number",
            "title",
            "body",
            "status",
            "labels",
            "author",
            "assignees",
            "commentsCount",
            "createdAt",
            "updatedAt",
        ]
        read_only_fields = [
            "id",
            "repositoryId",
            "number",
            "status",
            "author",
            "assignees",
            "commentsCount",
            "createdAt",
            "updatedAt",
        ]

    def get_assignees(self, issue: Issue) -> list:
        return []

    def get_commentsCount(self, issue: Issue) -> int:
        return 0


class IssueAttachmentSerializer(serializers.ModelSerializer):
    uploadedAt = serializers.DateTimeField(source="uploaded_at", read_only=True)

    class Meta:
        model = IssueAttachment
        fields = ["issue", "file", "uploadedAt"]


class PullRequestSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    repositoryId = serializers.CharField(source="repo_id", read_only=True)
    number = serializers.IntegerField(source="relative_id", read_only=True)
    body = serializers.CharField(source="description")
    author = UserSerializer(source="submitted_by", read_only=True)
    sourceBranch = serializers.CharField(source="source_branch")
    targetBranch = serializers.CharField(source="target_branch")
    additions = serializers.IntegerField(read_only=True, default=0)
    deletions = serializers.IntegerField(read_only=True, default=0)
    changedFilesCount = serializers.IntegerField(read_only=True, default=0)
    createdAt = serializers.DateTimeField(source="submitted_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="submitted_at", read_only=True)

    class Meta:
        model = PullRequest
        fields = [
            "id",
            "repositoryId",
            "number",
            "title",
            "body",
            "author",
            "status",
            "sourceBranch",
            "targetBranch",
            "additions",
            "deletions",
            "changedFilesCount",
            "createdAt",
            "updatedAt",
        ]
        read_only_fields = [
            "id",
            "repositoryId",
            "number",
            "author",
            "status",
            "additions",
            "deletions",
            "changedFilesCount",
            "createdAt",
            "updatedAt",
        ]


class StarSerializer(serializers.ModelSerializer):
    starredBy = serializers.PrimaryKeyRelatedField(source="starred_by", read_only=True)
    starredAt = serializers.DateTimeField(source="starred_at", read_only=True)

    class Meta:
        model = Star
        fields = ["repo", "starredBy", "starredAt"]
        read_only_fields = fields


class ForkSerializer(serializers.ModelSerializer):
    forkedBy = serializers.PrimaryKeyRelatedField(source="forked_by", read_only=True)
    forkedAt = serializers.DateTimeField(source="forked_at", read_only=True)

    class Meta:
        model = Fork
        fields = ["repo", "forkedBy", "forkedAt"]
        read_only_fields = fields


class WatcherSerializer(serializers.ModelSerializer):
    watchedBy = serializers.PrimaryKeyRelatedField(source="watched_by", read_only=True)
    watchedAt = serializers.DateTimeField(source="watched_at", read_only=True)

    class Meta:
        model = Watcher
        fields = ["repo", "watchedBy", "watchedAt"]
        read_only_fields = fields
