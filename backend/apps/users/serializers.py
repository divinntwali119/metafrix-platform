from collections.abc import Mapping

from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.db import transaction
from rest_framework import serializers

from .models import ContactEmail, IgnoredRepo, Profile, Settings, SocialAccount, User


class UserSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
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
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    isFollowed = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "name",
            "email",
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
            "createdAt",
            "isFollowed",
        ]
        read_only_fields = fields

    def to_representation(self, instance: User) -> dict:
        representation = super().to_representation(instance)
        request = self.context.get("request")
        is_owner = request and request.user.is_authenticated and request.user.pk == instance.pk
        if not is_owner and not self.context.get("include_email", False):
            representation.pop("email", None)
        return representation

    def get_name(self, user: User) -> str:
        return user.get_full_name().strip() or user.username

    def get_avatar(self, user: User) -> str:
        profile = self._profile(user)
        if not profile or not profile.profile_img:
            return "/avatar-placeholder.svg"
        try:
            image_url = profile.profile_img.url
        except ValueError:
            return "/avatar-placeholder.svg"
        request = self.context.get("request")
        return request.build_absolute_uri(image_url) if request else image_url

    def get_bio(self, user: User) -> str:
        profile = self._profile(user)
        return profile.bio or "" if profile else ""

    def get_location(self, user: User) -> str:
        profile = self._profile(user)
        return profile.location or "" if profile else ""

    def get_website(self, user: User) -> str:
        profile = self._profile(user)
        return profile.site_url or "" if profile else ""

    def get_skills(self, user: User) -> list[str]:
        expertise = user.get_expertise_domain_display()
        return [expertise] if expertise else []

    def get_technologies(self, user: User) -> list[str]:
        return []

    def get_followersCount(self, user: User) -> int:
        return user.followers_count if hasattr(user, "followers_count") else user.follower_links.count()

    def get_followingCount(self, user: User) -> int:
        return user.following_count if hasattr(user, "following_count") else user.following_links.count()

    def get_repositoriesCount(self, user: User) -> int:
        request = self.context.get("request")
        if request and request.user.is_authenticated and request.user.pk == user.pk:
            return user.repositories.count()
        return user.repositories.filter(access="publique").count()

    def get_contributionsCount(self, user: User) -> int:
        return getattr(user, "contributions_count", 0)

    def get_isFollowed(self, user: User) -> bool:
        request = self.context.get("request")
        if not request or not request.user.is_authenticated or request.user.pk == user.pk:
            return False
        return user.follower_links.filter(follower=request.user).exists()

    @staticmethod
    def _profile(user: User) -> Profile | None:
        try:
            return user.profile
        except Profile.DoesNotExist:
            return None


class CurrentUserUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(min_length=2, max_length=150, required=False, trim_whitespace=True)
    bio = serializers.CharField(max_length=1600, required=False, allow_blank=True)
    location = serializers.CharField(max_length=100, required=False, allow_blank=True)
    website = serializers.URLField(max_length=2048, required=False, allow_blank=True)

    def to_internal_value(self, data: object) -> dict:
        if isinstance(data, Mapping):
            unknown_fields = set(data.keys()) - set(self.fields)
            if unknown_fields:
                raise serializers.ValidationError(
                    {field: ["Ce champ n’est pas modifiable via cette route."] for field in unknown_fields}
                )
        return super().to_internal_value(data)

    @transaction.atomic
    def update(self, instance: User, validated_data: dict) -> User:
        name = validated_data.pop("name", None)
        if name is not None:
            name_parts = name.split(maxsplit=1)
            instance.first_name = name_parts[0]
            instance.last_name = name_parts[1] if len(name_parts) > 1 else ""
            instance.save(update_fields=["first_name", "last_name"])

        profile_fields = {
            "bio": "bio",
            "location": "location",
            "website": "site_url",
        }
        if validated_data:
            profile, _ = Profile.objects.get_or_create(user=instance)
            for input_field, model_field in profile_fields.items():
                if input_field in validated_data:
                    value = validated_data[input_field]
                    if input_field in {"location", "website"} and not value:
                        value = None
                    setattr(profile, model_field, value)
            profile.save()
        return instance


class RegistrationSerializer(serializers.Serializer):
    name = serializers.CharField(min_length=2, max_length=150, trim_whitespace=True)
    username = serializers.CharField(
        min_length=3,
        max_length=150,
        validators=[UnicodeUsernameValidator()],
    )
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(min_length=10, max_length=128, write_only=True)

    def validate_email(self, value: str) -> str:
        normalized_email = value.strip().lower()
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError("Cette adresse e-mail est déjà utilisée.")
        return normalized_email

    def validate_username(self, value: str) -> str:
        normalized_username = value.strip()
        if User.objects.filter(username__iexact=normalized_username).exists():
            raise serializers.ValidationError("Ce nom d’utilisateur est déjà utilisé.")
        return normalized_username

    def validate_password(self, value: str) -> str:
        attrs = self.initial_data
        name_parts = str(attrs.get("name", "")).strip().split(maxsplit=1)
        user = User(
            username=str(attrs.get("username", "")),
            email=str(attrs.get("email", "")),
            first_name=name_parts[0] if name_parts else "",
            last_name=name_parts[1] if len(name_parts) > 1 else "",
        )
        validate_password(value, user=user)
        return value

    def create(self, validated_data: dict) -> User:
        name_parts = validated_data.pop("name").split(maxsplit=1)
        return User.objects.create_user(
            **validated_data,
            first_name=name_parts[0],
            last_name=name_parts[1] if len(name_parts) > 1 else "",
            expertise_domain=User.Domain.OTHER,
        )


class ProfileSerializer(serializers.ModelSerializer):
    profileImg = serializers.ImageField(source="profile_img", allow_null=True, required=False)
    siteUrl = serializers.URLField(source="site_url", allow_blank=True, required=False)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Profile
        fields = ["bio", "profileImg", "siteUrl", "location", "updatedAt"]


class ContactEmailSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = ContactEmail
        fields = ["email", "type", "createdAt"]


class SocialAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialAccount
        fields = ["link"]


class SettingsSerializer(serializers.ModelSerializer):
    narratorEnabled = serializers.BooleanField(source="narrator_enabled")
    videoPostsSubtitles = serializers.BooleanField(source="video_posts_subtitles")
    voiceCommander = serializers.BooleanField(source="voice_commander")
    voiceCommanderShortcut = serializers.CharField(source="voice_commander_shortcut")
    defaultNotifEmail = serializers.PrimaryKeyRelatedField(
        source="default_notif_email",
        queryset=ContactEmail.objects.all(),
        allow_null=True,
        required=False,
    )
    watchingRepos = serializers.ChoiceField(source="watching_repos", choices=Settings.NotifyMeOn.choices)
    followingUsers = serializers.ChoiceField(source="following_users", choices=Settings.NotifyMeOn.choices)
    securityAlertsNotif = serializers.EmailField(source="security_alerts_notif")
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Settings
        fields = [
            "narratorEnabled",
            "videoPostsSubtitles",
            "voiceCommander",
            "voiceCommanderShortcut",
            "defaultNotifEmail",
            "watchingRepos",
            "followingUsers",
            "mentions",
            "invitations",
            "recruting",
            "securityAlertsNotif",
            "updatedAt",
        ]


class IgnoredRepoSerializer(serializers.ModelSerializer):
    userSettings = serializers.PrimaryKeyRelatedField(source="user_settings", queryset=Settings.objects.all())
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = IgnoredRepo
        fields = ["repo", "userSettings", "createdAt"]

