from django.db import models
from django.conf import settings

# Repo model
class Repository(models.Model):
    class Access(models.TextChoices):
        PUBLIC = 'publique', "Publique"
        PRIVATE = 'private', "Privée"
        
    name = models.CharField(max_length=120)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    access = models.CharField(max_length=20, choices=Access.choices)
    description = models.TextField(blank=True, null=True)
    archived = models.BooleanField(default=False)
    license_template = models.CharField(max_length=50, null=True, blank=True,)
    gitignore_template = models.CharField(max_length=60, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        verbose_name = "Dépôt"
        ordering = ['-updated_at', '-created_at']
        constraints = [
            models.UniqueConstraint(fields=['name'], name='unique_name_per_repository')
        ]    
        
    def __str__(self) -> str:
        return f"{self.owner}/{self.name}"
    
# Repositories settings
class RepositorySettings(models.Model):
    class MergeStrategy(models.TextChoices):
        MERGE = 'merge', "Créer un commit de fusion"
        SQUASH = 'squash', "Fusionner les commits"
        REBASE = 'rebase', "Rebaser les commits"

    repo = models.OneToOneField(Repository, on_delete=models.CASCADE, related_name='settings')
    default_branch = models.CharField(max_length=100, default='main')
    issues_enabled = models.BooleanField(default=True)
    pull_requests_enabled = models.BooleanField(default=True)
    merge_strategy = models.CharField(
        max_length=10,
        choices=MergeStrategy.choices,
        default=MergeStrategy.MERGE,
    )
    require_pull_request_reviews = models.BooleanField(default=False)
    required_approvals = models.PositiveSmallIntegerField(default=0)
    delete_branch_after_merge = models.BooleanField(default=True)
    allow_force_pushes = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Paramètre du dépôt"
        verbose_name_plural = "Paramètres du dépôt"
        
# Issue model
class Issue(models.Model):
    class Status(models.TextChoices):
        OPEN = 'open', "Ouvert"
        CLOSED = 'closed', "Fermé"
        
    class Type(models.TextChoices):
        BUG = 'bug', "Bug"
        FEATURE = 'feature', "Fonctionnalité"
        
    repo = models.ForeignKey(Repository, on_delete=models.CASCADE, related_name='issues')
    title = models.CharField(max_length=100)
    description = models.TextField()
    labels = models.CharField(max_length=150)
    type = models.CharField(max_length=20, choices=Type.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='issues')
    submitted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-submitted_at',]
        
    @property
    def relative_id(self) -> int:
        return self.repo.issues.order_by('submitted_at').index(self)
        
    def __str__(self) -> str:
        return f"{self.title} soumis par {self.submitted_by.username} à {self.submitted_at}"

# Issue file attachment
class IssueAttachment(models.Model):
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='issue_attachments/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-uploaded_at',]
        
    def __str__(self) -> str:
        return f"Fichier {self.file.name} pour l'issue {self.issue.title} à {self.uploaded_at}"

# Pull request model
class PullRequest(models.Model):
    class Status(models.TextChoices):
        APPROVED = 'approved', "Approuvé"
        REJECTED = 'rejected', "Rejeté"
        
    title = models.CharField(max_length=120)
    description = models.TextField()
    source_branch = models.CharField(max_length=60)
    target_branch = models.CharField(max_length=60)
    issue = models.OneToOneField(Issue, on_delete=models.SET_NULL, related_name='pull_request', blank=True, null=True)
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='pull_requests')
    submitted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-submitted_at',]
        
    def __str__(self) -> str:
        return f"{self.title} par {self.submitted_by.username}" + (f" a résolu {self.issue.relative_id}" if getattr(self, 'issue', None) else "")


# Star model    
class Star(models.Model):
    repo = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='stars')
    starred_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    starred_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-starred_at', 'starred_by']
        
    def __str__(self) -> str:
        return f"{self.repo} aimé par {self.starred_by} à {self.starred_at}"
    
    
# Fork model
class Fork(models.Model):
    repo = models.ForeignKey(Repository, on_delete=models.CASCADE, related_name='forks')
    forked_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    forked_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-forked_at', 'forked_by']
        
    def __str__(self) -> str:
        return f"{self.repo} forké par {self.forked_by} à {self.forked_at}"
    
# Watcher model
class Watcher(models.Model):
    repo = models.ForeignKey(Repository, on_delete=models.CASCADE, related_name='watchers')
    watched_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    watched_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-watched_at', 'watched_by']
        
    def __str__(self) -> str:
        return f"{self.repo} surveillé par {self.watched_by} à {self.watched_at}"