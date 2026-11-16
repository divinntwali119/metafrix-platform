from rest_framework import serializers
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
        return obj.repos.all().count()
    
    def get_contributionsCount(self, obj: User) -> int:
        return sum([team_link.team.boards.filter(repo__isnull=False).count() for team_link in obj.team_links])
        
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
        
