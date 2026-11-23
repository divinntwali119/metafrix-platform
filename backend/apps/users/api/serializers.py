from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers
from apps.collaborations.models import Board
from ..models import (
    User,
    Profile,
    ContactEmail,
    SocialAccount,
    Settings,
    IgnoredRepo,
)

# User serializer
class UserSerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source='first_name')
    lastName = serializers.CharField(source='last_name')
    expertiseDomain = serializers.CharField(source='expertise_domain')
    createdAt = serializers.DateTimeField(source='created_at', format='%Y-%m-%d %H:%M')
    avatar = serializers.SerializerMethodField()
    repositoriesCount = serializers.SerializerMethodField()
    contributionsCount = serializers.SerializerMethodField()
    followersCount = serializers.SerializerMethodField()
    followingCount = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'avatar',
            'username', 
            'firstName', 
            'lastName', 
            'email', 
            'expertiseDomain',
            'createdAt',
            'repositoriesCount',
            'contributionsCount',
            'followersCount',
            'followingCount'
        ]
        read_only_fields = ['createdAt', 'repositoriesCount', 'contributionsCount', 'followersCount', 'followingCount'] 
        
    def get_avatar(self, obj : User) -> str:
        profile = getattr(obj, "profile", None)
        if profile is None or not profile.profile_img:
            return ""
        return profile.profile_img.name
    
    def get_repositoriesCount(self, obj: User) -> int:
        return obj.repositories.count()
    
    def get_contributionsCount(self, obj: User) -> int:
        team_ids = obj.team_links.values_list("team_id", flat=True)
        return Board.objects.filter(team_id__in=team_ids, repo__isnull=False).count()
        
    def get_followersCount(self, obj: User) -> int:
        return obj.followers.all().count()
    
    def get_followingCount(self, obj: User) -> int:
        return obj.following.all().count()
    
        
# Contact email serializer
class ContactEmailSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source='created_at', format='%Y-%m-%d %H:%M', read_only=True)
    
    class Meta:
        model = ContactEmail
        fields = ['email', 'type', 'createdAt']
        

# Social account serializer
class SocialAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialAccount
        fields = ['link']
        
        
# Profile serializer
class ProfileSerializer(serializers.ModelSerializer):
    profileImg = serializers.ImageField(source='profile_img', required=False)
    siteUrl = serializers.URLField(
        source='site_url',
        required=False,
        allow_blank=True,
        allow_null=True,
    )
    updatedAt = serializers.DateTimeField(source='updated_at', format='%Y-%m-%d %H:%M', read_only=True)
    socialAccounts = SocialAccountSerializer(source='social_accounts', many=True, read_only=True)
    contactEmails = ContactEmailSerializer(source='emails', many=True, read_only=True)
    
    class Meta:
        model = Profile
        fields = ['bio', 'profileImg', 'siteUrl', 'location', 'updatedAt', 'socialAccounts', 'contactEmails']
        

# Tgnored repo serializer
class IgnoredRepoSerializer(serializers.ModelSerializer):
    userSettings = serializers.PrimaryKeyRelatedField(source='user_settings', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', format='%Y-%m-%d %H:%M', read_only=True)

    class Meta:
        model = IgnoredRepo
        fields = ['repo', 'userSettings', 'createdAt']
        
        
# Settings serializer
class SettingsSerializer(serializers.ModelSerializer):
    narratorEnabled = serializers.BooleanField(source='narrator_enabled')
    videoPostsSubtitles = serializers.BooleanField(source='video_posts_subtitles')
    voiceCommander = serializers.BooleanField(source='voice_commander')
    voiceCommanderShortcut = serializers.CharField(source='voice_commander_shortcut')
    defaultNotifEmail = serializers.PrimaryKeyRelatedField(source='default_notif_email', queryset=ContactEmail.objects.none(), allow_null=True, required=False)
    watchingRepos = serializers.ChoiceField(source='watching_repos', choices=Settings.NotifyMeOn.choices)
    followingUsers = serializers.ChoiceField(source='following_users', choices=Settings.NotifyMeOn.choices)
    securityAlertsNotif = serializers.EmailField(source='security_alerts_notif')
    updatedAt = serializers.DateTimeField(source='updated_at', format='%Y-%m-%d %H:%M', read_only=True)
    ignoredRepos = IgnoredRepoSerializer(source='ignored_repos', many=True, read_only=True)

    class Meta:
        model = Settings
        fields = [
            'narratorEnabled',
            'videoPostsSubtitles',
            'voiceCommander',
            'voiceCommanderShortcut',
            'defaultNotifEmail',
            'watchingRepos',
            'followingUsers',
            'mentions',
            'invitations',
            'recruting',
            'securityAlertsNotif',
            'updatedAt',
            'ignoredRepos'
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated:
            self.fields["defaultNotifEmail"].queryset = ContactEmail.objects.filter(
                profile__user=request.user
            )


class DeveloperSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="pk", read_only=True)
    name = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    website = serializers.SerializerMethodField()
    skills = serializers.SerializerMethodField()
    technologies = serializers.SerializerMethodField()
    followersCount = serializers.SerializerMethodField()
    followingCount = serializers.SerializerMethodField()
    repositoriesCount = serializers.SerializerMethodField()
    contributionsCount = serializers.SerializerMethodField()
    isFollowed = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "name",
            "avatar",
            "bio",
            "location",
            "website",
            "skills",
            "technologies",
            "followersCount",
            "followingCount",
            "repositoriesCount",
            "contributionsCount",
            "isFollowed",
            "createdAt",
        ]

    def get_name(self, obj: User) -> str:
        return obj.get_full_name().strip() or obj.username

    def _profile(self, obj: User) -> Profile | None:
        if not hasattr(obj, "_developer_profile_cache"):
            try:
                obj._developer_profile_cache = obj.profile
            except ObjectDoesNotExist:
                obj._developer_profile_cache = None
        return obj._developer_profile_cache

    def get_avatar(self, obj: User) -> str:
        profile = self._profile(obj)
        if profile is None or not profile.profile_img:
            return ""
        try:
            return profile.profile_img.url
        except (ValueError, OSError):
            return profile.profile_img.name or ""

    def get_bio(self, obj: User) -> str:
        profile = self._profile(obj)
        return profile.bio or "" if profile is not None else ""

    def get_location(self, obj: User) -> str:
        profile = self._profile(obj)
        return profile.location or "" if profile is not None else ""

    def get_website(self, obj: User) -> str:
        profile = self._profile(obj)
        return profile.site_url or "" if profile is not None else ""

    def get_skills(self, obj: User) -> list[str]:
        return [obj.get_expertise_domain_display()]

    def get_technologies(self, _obj: User) -> list[str]:
        return []

    def get_followersCount(self, obj: User) -> int:
        return obj.followers.count()

    def get_followingCount(self, obj: User) -> int:
        return obj.following.count()

    def get_repositoriesCount(self, obj: User) -> int:
        return obj.repositories.count()

    def get_contributionsCount(self, obj: User) -> int:
        team_ids = obj.team_links.values_list("team_id", flat=True)
        return Board.objects.filter(
            team_id__in=team_ids,
            repo__isnull=False,
        ).count()

    def get_isFollowed(self, obj: User) -> bool:
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            return False
        return obj.followers.filter(follower=request.user).exists()


class CurrentUserSerializer(DeveloperSerializer):
    email = serializers.EmailField(read_only=True)
    emailVerified = serializers.BooleanField(source="is_email_verified", read_only=True)

    class Meta(DeveloperSerializer.Meta):
        fields = [*DeveloperSerializer.Meta.fields, "email", "emailVerified"]


# Serializers to update cureent user profile
class CurrentUserUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(required=False, min_length=2, max_length=150)
    bio = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField(required=False, allow_blank=True, max_length=100)
    website = serializers.URLField(
        required=False,
        allow_blank=True,
        allow_null=True,
        max_length=2048,
    )
    email = serializers.EmailField(required=False)

    def validate_email(self, value: str) -> str:
        if value.strip().casefold() != self.instance.email.casefold():
            raise serializers.ValidationError(
                "Une nouvelle adresse e-mail doit être vérifiée avant son utilisation."
            )
        return value

    def update(self, instance: User, validated_data: dict) -> User:
        name = validated_data.pop("name", None)
        if name is not None:
            name_parts = name.strip().split(maxsplit=1)
            instance.first_name = name_parts[0]
            instance.last_name = name_parts[1] if len(name_parts) > 1 else ""
            instance.save(update_fields=["first_name", "last_name"])

        profile_fields = {
            field: validated_data[field]
            for field in ("bio", "location", "website")
            if field in validated_data
        }
        if profile_fields:
            profile, _ = Profile.objects.get_or_create(user=instance)
            for field, value in profile_fields.items():
                model_field = "site_url" if field == "website" else field
                setattr(profile, model_field, value)
            profile.save(update_fields=[*{("site_url" if key == "website" else key) for key in profile_fields}, "updated_at"])

        return instance