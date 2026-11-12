from rest_framework import serializers
from .models import (
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
    
    class Meta:
        model = User
        fields = ['username', 'firstName', 'lastName', 'email', 'expertiseDomain']
        

# Profile serializer
class ProfileSerializer(serializers.ModelSerializer):
    profileImg = serializers.ImageField(source='profile_img', required=True)
    siteUrl = serializers.URLField(source='site_url', required=True)
    updatedAt = serializers.DateTimeField(source='updated_at', format='%Y-%m-%d %H:%M')
    
    class Meta:
        model = Profile
        fields = ['slug', 'bio', 'profileImg', 'siteUrl', 'location', 'updated']
        read_only_fields = ['slug']
        
        
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


# Settings serializer
class SettingsSerializer(serializers.ModelSerializer):
    narratorEnabled = serializers.BooleanField(source='narrator_enabled')
    videoPostsSubtitles = serializers.BooleanField(source='video_posts_subtitles')
    voiceCommander = serializers.BooleanField(source='voice_commander')
    voiceCommanderShortcut = serializers.CharField(source='voice_commander_shortcut')
    defaultNotifEmail = serializers.PrimaryKeyRelatedField(source='default_notif_email', queryset=ContactEmail.objects.all(), allow_null=True, required=False)
    watchingRepos = serializers.ChoiceField(source='watching_repos', choices=Settings.NotifyMeOn.choices)
    followingUsers = serializers.ChoiceField(source='following_users', choices=Settings.NotifyMeOn.choices)
    securityAlertsNotif = serializers.EmailField(source='security_alerts_notif')
    updatedAt = serializers.DateTimeField(source='updated_at', format='%Y-%m-%d %H:%M', read_only=True)

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
        ]
        

# Tgnored repo serializer
class IgnoredRepoSerializer(serializers.ModelSerializer):
    userSettings = serializers.PrimaryKeyRelatedField(source='user_settings', queryset=Settings.objects.all())
    createdAt = serializers.DateTimeField(source='created_at', format='%Y-%m-%d %H:%M', read_only=True)

    class Meta:
        model = IgnoredRepo
        fields = ['repo', 'userSettings', 'createdAt']
        
