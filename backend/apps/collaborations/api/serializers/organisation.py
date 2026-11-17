from typing import Any
from collections.abc import Mapping

from rest_framework import serializers

from apps.repositories.models import Repository
from apps.repositories.api.serializers import RepositorySerializer
from apps.users.api.serializers import UserSerializer
from ...models import (
    Organisation,
)

# Organisation serializer
class OrganisationSerializer(serializers.ModelSerializer):
    id = serializers.CharField()
    avatar = serializers.SerializerMethodField()
    membersCount = serializers.SerializerMethodField()
    repositoriesCount = serializers.SerializerMethodField()
    repositoryIds = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()
    repositories = serializers.SerializerMethodField()
    isMember = serializers.SerializerMethodField()
    viewerRole = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Organisation
        fields = [
            'id', 
            'name', 
            'slug', 
            'description', 
            'website', 
            'location', 
            'avatar',
            'membersCount', 
            'repositoriesCount', 
            'repositoryIds', 
            'members', 
            'repositories',
            'isMember', 
            'viewerRole', 
            'createdAt',
        ]
        read_only_fields = [
            'id', 
            'avatar', 
            'membersCount', 
            'repositoriesCount', 
            'repositoryIds', 
            'members',
            'repositories', 
            'isMember', 
            'viewerRole', 
            'createdAt',
        ]

    def get_avatar(self, organisation : Organisation) -> str:
        return organisation.image_profile.url if organisation.image_profile else '/avatar-placeholder.svg'

    def get_membersCount(self, organisation : Organisation) -> int:
        return organisation.memberships.count()

    def get_repositoriesCount(self, organisation: Organisation) -> int:
        return organisation.repository_links.filter(repository__access=Repository.Access.PUBLIC).count()

    def get_repositoryIds(self, organisation: Organisation) -> list[str]:
        return [
            str(repository_id)
            for repository_id in organisation.repository_links.filter(
                repository__access=Repository.Access.PUBLIC
            ).values_list('repository_id', flat=True)
        ]

    def get_members(self, organisation: Organisation) -> list[dict[str, Any]]:
        if self.context.get('include_details', False):
            return []
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return []
        memberships = organisation.memberships.select_related('user', 'user__profile').all()
        return [
            {'user': UserSerializer(link.user, context={'request': request}).data, 'role': link.role}
            for link in memberships
        ]
        
    def get_repositories(self, organisation: Organisation) -> list[dict[str, Any]]:
        if not self.context.get('include_details', True):
            return []
        request = self.context.get('request')
        repositories = Repository.objects.filter(
            organisation_links__organisation=organisation,
            access=Repository.Access.PUBLIC,
        ).select_related('owner', 'owner__profile', 'settings').distinct()
        return RepositorySerializer(repositories, many=True, context={'request': request}).data

    def get_isMember(self, organisation: Organisation) -> bool:
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return organisation.memberships.filter(user=request.user).exists()

    def get_viewerRole(self, organisation: Organisation) -> str | None:
        request = self.context.get('request')
        if not request or not request.user.is_authenticated or not self.context.get('include_details', True):
            return None
        return organisation.memberships.filter(user=request.user).values_list('role', flat=True).first()


# Organisation creation serializer
class OrganisationCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100, trim_whitespace=True)
    slug = serializers.SlugField(max_length=100, required=False, allow_blank=True)
    description = serializers.CharField(max_length=2000, required=False, allow_blank=True, default='')
    website = serializers.URLField(max_length=2048, required=False, allow_blank=True, default='')
    location = serializers.CharField(max_length=160, required=False, allow_blank=True, default='')

    def validate_name(self, value: str) -> str:
        if Organisation.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError("Une organisation porte déjà ce nom.")
        return value

    def validate_slug(self, value: str) -> str:
        if value and Organisation.objects.filter(slug__iexact=value).exists():
            raise serializers.ValidationError("Cet identifiant est déjà utilisé.")
        return value

    def create(self, validated_data: dict[str, Any]) -> Organisation:
        return Organisation.objects.create(created_by=self.context['request'].user, **validated_data)


# Organisation update serializer
class OrganisationUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100, required=False, trim_whitespace=True)
    description = serializers.CharField(max_length=2000, required=False, allow_blank=True)
    website = serializers.URLField(max_length=2048, required=False, allow_blank=True)
    location = serializers.CharField(max_length=160, required=False, allow_blank=True)

    def to_internal_value(self, data: Mapping[str, Any]) -> dict[str, Any]:
        if isinstance(data, Mapping):
            unknown = set(data) - set(self.fields)
            if unknown:
                raise serializers.ValidationError({key: ["Ce champ ne peut pas être modifié ici."] for key in unknown})
        return super().to_internal_value(data)

    def validate_name(self, value: str) -> str:
        if Organisation.objects.filter(name__iexact=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("Une organisation porte déjà ce nom.")
        return value

    def update(self, instance: Organisation, validated_data: dict[str, Any]) -> Organisation:
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if validated_data:
            instance.save(update_fields=list(validated_data))
        return instance