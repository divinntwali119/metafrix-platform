from django.db import models
from django.contrib.auth.models import AbstractUser

# The user model
class User(AbstractUser):
    class Domain(models.TextChoices):
        # Web domain
        WEB_FULLSTACK = 'web_fullstack', "Developpeur web full stack"
        WEB_FRONTEND = 'web_frotend', "Developpeur web front-end"
        WEB_BACKEND = 'web_backend', "Developpeur web backend"
        WEB_DESIGN = 'web_design', "Graphiste ou designer web"
        # Software development
        SOFTWARE_ENGENEER = 'software_engeneer', "Ingenieur logiciel"
        MOBILE_DEVELOPER = 'mobile_developer', "Développeur ou développeuse mobile"
        DESKTOP_DEVELOPER = 'desktop_developer', "Développeur ou développeuse logiciel de bureau"
        DEVOPS = 'devops', "Ingénieur ou ingénieure DevOps"
        DATA_SCIENTIST = 'data_scientist', "Spécialiste des données"
        AI_ML_ENGINEER = 'ai_ml_engineer', "Spécialiste en IA et apprentissage automatique"
        CYBERSECURITY = 'cybersecurity', "Spécialiste en cybersécurité"
        QA_TESTER = 'qa_tester', "Testeur ou testeuse logiciel"
        # Video game development
        GAME_DEVELOPER = 'game_developer', "Développeur ou développeuse de jeux vidéo"
        GAME_DESIGNER = 'game_designer', "Concepteur ou conceptrice de jeux vidéo"
        LEVEL_DESIGNER = 'level_designer', "Concepteur ou conceptrice de niveaux"
        GAMEPLAY_PROGRAMMER = 'gameplay_programmer', "Programmeur ou programmeuse gameplay"
        CHARACTER_ARTIST = 'character_artist', "Artiste de personnages"
        CHARACTER_MODELer = 'character_modeler', "Modeleur ou modeleuse 3D de personnages"
        ENVIRONMENT_ARTIST = 'environment_artist', "Artiste d'environnements 2D ou 3D"
        ANIMATOR = 'animator', "Animateur ou animatrice 2D ou 3D"
        RIGGER = 'rigger', "Spécialiste en rigging"
        VFX_ARTIST = 'vfx_artist', "Artiste effets visuels"
        GAME_AUDIO = 'game_audio', "Concepteur ou conceptrice audio pour jeux vidéo"
        NARRATIVE_DESIGNER = 'narrative_designer', "Concepteur ou conceptrice narrative"
        # Design and creation
        UX_UI_DESIGNER = 'ux_ui_designer', "Designer UX/UI"
        GRAPHIC_DESIGNER = 'graphic_designer', "Graphiste ou designer graphique"
        ILLUSTRATOR = 'illustrator', "Illustrateur ou illustratrice"
        CONCEPT_ARTIST = 'concept_artist', "Artiste conceptuel ou conceptuelle"
        ARTIST_3D = '3d_artist', "Artiste 3D"
        VIDEO_EDITOR = 'video_editor', "Monteur ou monteuse vidéo"
        WRITER = 'writer', "Rédacteur ou rédactrice"
        TRANSLATOR = 'translator', "Traducteur ou traductrice"
        OTHER = 'other', "Autre"
        
    expertise_domain = models.CharField(max_length=60, choices=Domain.choices)
    
    class Meta:
        verbose_name = "Utilisateur"
        
        
    def __str__(self) -> str:
        return self.get_username()
    
    
############################################### USER ADDITONAL INFORMATIONS ###############################################

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profile_img = models.ImageField(upload_to='user/profiles_images/', null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    site_url = models.URLField(max_length=30, null=True, blank=True)
    location = models.CharField(max_length=100)
    updated_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = "Profile utilisateur"
        verbose_name_plural = "Profile utilisateurs"
        ordering = ['user']
        
class ContactEmail(models.Model):
    class Type(models.TextChoices):
        PRIMARY = 'primary', "Primaire"
        PUBLIC = 'publiic', "Publique"
        PRIVATE = 'private', "Prive"
        DISPAYED = 'displayed', "Email a afficher"
        
    email = models.EmailField(unique=True)
    type = models.CharField(max_length=20, choices=Type.choices)
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='emails')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Email d'utilisateur"
        verbose_name_plural = "Emails d'utilisateur"
        ordering = ['email', '-created_at']
        
    def __str__(self) -> str:
        return self.email
    
class SocialAccount(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='social_accounts')
    link = models.URLField(max_length=100)
    
    
    class Meta:
        verbose_name = "Lien de reseau social"
        verbose_name_plural = "Liens de reseau social"
        ordering = ['profile']
        
    def __str__(self) -> str:
        return f"{self.profile.user.username} | {self.link}"


############################################### USER SETTINGS ###############################################

class Settings(models.Model):    
    class NotifyMeOn(models.TextChoices):
        METAFRIX = 'metafrix', "Sur Metafrix"
        EMAIL = 'email', "Par email"
        BOTH = 'both', "Sur les deux"
        
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='setting')
        
    # Accessibility
    narrator_enabled = models.BooleanField(default=False)
    video_posts_subtitles = models.BooleanField(default=True)
    voice_commander = models.BooleanField(default=True)
    voice_commander_shortcut = models.CharField(max_length=5)
    
    
    # Notfications
    default_notif_email = models.OneToOneField(ContactEmail, on_delete=models.SET_NULL, null=True, blank=True)
    watching_repos = models.CharField(max_length=20, choices=NotifyMeOn.choices)
    following_users = models.CharField(max_length=20, choices=NotifyMeOn.choices)
    mentions = models.CharField(max_length=20, choices=NotifyMeOn.choices)
    invitations = models.CharField(max_length=20, choices=NotifyMeOn.choices)
    recruting = models.CharField(max_length=20, choices=NotifyMeOn.choices)
    security_alerts_notif = models.EmailField(max_length=100)
    
    updated_at = models.DateTimeField(null=True, blank=True)
    
    
class IgnoredRepo(models.Model):
    repo = models.ForeignKey('repositories.Repository', on_delete=models.CASCADE)
    user_settings = models.ForeignKey(Settings, on_delete=models.CASCADE, related_name='ignored_repos')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Dépôt ignore"
        verbose_name_plural = "Dépôts ignores"
        ordering = ['repo']
        
    def __str__(self) -> str:
        return f"Ignore {self.repo}"
    