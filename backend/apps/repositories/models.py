from django.db import models
from django.conf import settings

# Repo model
class Repository(models.Model):
    class Access(models.TextChoices):
        PUBLIC = 'publique', "Publique"
        PRIVATE = 'private', "Privee"
        
    name = models.CharField(max_length=120)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    access = models.CharField(max_length=20, choices=Access.choices)
    description = models.TextField(blank=True, null=True)
    license = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-updated_at', '-created_at']
        constraints = [
            models.UniqueConstraint(fields=['name'], name='unique_name_per_repository')
        ]    
        
    def __str__(self) -> str:
        return f"{self.owner}/{self.name}"
        
# Issue model
class Issue(models.Model):
    repo = models.ForeignKey(Repository, on_delete=models.PROTECT, related_name='issues')
    title = models.CharField(max_length=100)
    description = models.TextField()
    labels = models.CharField(max_length=150)
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='issues')
    submitted_at = models.DateTimeField(auto_now_add=True)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, blank=True, null=True)
    
    class Meta:
        ordering = ['-submitted_at']
        
    @property
    def relative_id(self) -> int:
        return self.repo.issues.order_by('submitted_at').index(self)
        
    def __str__(self) -> str:
        return f"{self.title} soumis par {self.submitted_by.username} a {self.submitted_at}"


# Pull request model
class PullRequest(models.Model):
    class Status(models.TextChoices):
        APPROVED = 'approved', "Approuve"
        REJECTED = 'rejected', "Rejjete"
        
    title = models.CharField(max_length=120)
    description = models.TextField()
    source = models.CharField(max_length=60)
    target = models.CharField(max_length=60)
    issue = models.OneToOneField(Issue, on_delete=models.PROTECT, related_name='pull_request')
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='pull_requests')
    submitted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-submitted_at']
        
    def __str__(self) -> str:
        return f"{self.title} par {self.submitted_by.username} a resolu {self.issue.relative_id}"


# Star model    
class Star(models.Model):
    repo = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='stars')
    starred_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    starred_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-starred_at', 'starred_by']
        
    def __str__(self) -> str:
        return f"{self.repo} aime par {self.starred_by} a {self.starred_at}"