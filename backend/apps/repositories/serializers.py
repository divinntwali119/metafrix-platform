from rest_framework import serializers

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

# Repository serializer
class RepositorySerializer(serializers.ModelSerializer):
    licenseTemplate = serializers.CharField(source='license_template')
    createdAt = serializers.DateTimeField(source='created_at', format='%Y-%m-%d %H:%M')
    updatedAt = serializers.DateTimeField(source='updated_at', format='%Y-%m-%d %H:%M')

    class Meta:
        model = Repository
        fields = ['name', 'owner', 'access', 'description', 'archived', 'licenseTemplate', 'createdAt', 'updatedAt']
        read_only_fields = ['owner', 'createdAt', 'updatedAt']
        

# Repository settings serializer
class RepositorySettingsSerializer(serializers.ModelSerializer):
    defaultBranch = serializers.CharField(source='default_branch')
    issuesEnabled = serializers.BooleanField(source='issues_enabled')
    pullRequestsEnabled = serializers.BooleanField(source='pull_requests_enabled')
    requirePullRequestReviews = serializers.BooleanField(source='require_pull_request_reviews')
    requiredApprovals = serializers.IntegerField(source='required_approvals')
    deleteBranchAfterMerge = serializers.BooleanField(source='delete_branch_after_merge')
    allowForcePushes = serializers.BooleanField(source='allow_force_pushes')
    updatedAt = serializers.DateTimeField(source='updated_at', format='%Y-%m-%d %H:%M', read_only=True)

    class Meta:
        model = RepositorySettings
        fields = [
            'defaultBranch',
            'issuesEnabled',
            'pullRequestsEnabled',
            'merge_strategy',
            'requirePullRequestReviews',
            'requiredApprovals',
            'deleteBranchAfterMerge',
            'allowForcePushes',
            'updatedAt',
        ]        
        

# Issue serializer
class IssueSerializer(serializers.ModelSerializer):
    relativeId = serializers.IntegerField(source='relative_id')
    submittedBy = serializers.PrimaryKeyRelatedField(source='submitted_by')
    submittedAt = serializers.DateTimeField(source='submitted_at', format='%Y-%m-%d %H:%M')

    class Meta:
        model = Issue
        fields = ['repo', 'relativeId', 'title', 'description', 'labels', 'type', 'status', 'submittedBy', 'submittedAt']
        read_only_fields = ['submittedBy', 'submittedAt', 'relativeId']
        

# Issue attachment serializer
class IssueAttachmentSerializer(serializers.ModelSerializer):
    uploadedAt = serializers.DateTimeField(source='uploaded_at', format='%Y-%m-%d %H:%M', read_only=True)

    class Meta:
        model = IssueAttachment
        fields = ['issue', 'file', 'uploadedAt']
        

# Watcher serializer
class PullRequestSerializer(serializers.ModelSerializer):
    sourceBranch = serializers.CharField(source='source_branch')
    targetBranch = serializers.CharField(source='target_branch')
    submittedBy = serializers.PrimaryKeyRelatedField(source='submitted_by')
    submittedAt = serializers.DateTimeField(source='submitted_at', format='%Y-%m-%d %H:%M')

    class Meta:
        model = PullRequest
        fields = ['title', 'description', 'sourceBranch', 'targetBranch', 'issue', 'submittedBy', 'submittedAt']
        read_only_fields = ['submittedBy', 'submittedAt']
        

# Star serializer
class StarSerializer(serializers.ModelSerializer):
    starredBy = serializers.PrimaryKeyRelatedField(source='starred_by')
    starredAt = serializers.DateTimeField(source='starred_at', format='%Y-%m-%d %H:%M')

    class Meta:
        model = Star
        fields = ['repo', 'starredBy', 'starredAt']
        read_only_fields = ['repo', 'starredBy', 'starredAt']
        

# Fork serializer
class ForkSerializer(serializers.ModelSerializer):
    forkedBy = serializers.PrimaryKeyRelatedField(source='forked_by')
    forkedAt = serializers.DateTimeField(source='forked_at',format='%Y-%m-%d %H:%M')

    class Meta:
        model = Fork
        fields = ['repo', 'forkedBy', 'forkedAt']
        read_only_fields = ['repo', 'forkedBy', 'forkedAt']


# Watcher serializer
class WatcherSerializer(serializers.ModelSerializer):
    watchedBy = serializers.PrimaryKeyRelatedField(source='watched_by')
    watchedAt = serializers.DateTimeField(source='watched_at', format='%Y-%m-%d %H:%M')

    class Meta:
        model = Watcher
        fields = ['repo', 'watchedBy', 'watchedAt']
        read_only_field = ['repo', 'watchedBy', 'watchedAt']
