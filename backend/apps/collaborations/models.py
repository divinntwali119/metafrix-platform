from django.db import models
from django.conf import settings

# Organisation model
class Organisation(models.Model):
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    image_profile = models.ImageField(upload_to='organisations/images/', null=True, blank=True) 
    
    class Meta:
        odering = ['name']
        constraints = [
            models.UniqueConstraint(fields=['name'])
        ]
        
    def __str__(self) -> str:
        return f"{self.name} | {self.created_by}"

# Team model
class Team(models.Model):
    name = models.CharField(max_length=100)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    organisation = models.ForeignKey(Organisation, on_delete=models.PROTECT, related_name='teams')
    images_profile = models.ImageField(upload_to='teams/images/', null=True, blank=True)
    
    class Meta:
        verbose_name = "Equipe"
        
    def __str__(self) -> str:
        return self.name
    

# Team member model
class Member(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_NAME, on_delete=models.PROTECT, related_name='team_links')
    role = models.CharField(max_length=40)
    tag = models.CharField(max_length=20, null=True, blank=True)
    
    class Meta:
        verbose_name = "Membre"
    
    def __str__(self) -> str:
        return f"{self.user.username} | {self.tag if len(self.tag.strip()) == 0 else self.role}"
    
    
# Invitation model
class Invitation(models.Model):
    repo = models.ForeignKey('repositories.Repository', on_delete=models.PROTECT, null=True, blank=True)
    from_team = models.ForeignKey(Team, on_delete=models.PROTECT, null=True, blank=True)
    from_organisation = models.ForeignKey(Organisation, on_delete=models.PROTECT, null=True, blank=True)
    to_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='invitations')
    accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        odering = ['-created_at']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(repo__isnull=False) & models.Q(from_team__isnull=False) & models.Q(from_organisation__isnull=False),
                name='invitation_needs_repo_or_from_team_or_from_organisation'
            )
        ]
    
    def __str__(self) -> str:
        return f"Invitation adresse a {self.to_user}"            