from django.db import models
from django.db.models import Q
from django.conf import settings
from django.utils.text import slugify

# Repo model
class Repository(models.Model):
    class Access(models.TextChoices):
        PUBLIC = 'publique', "Publique"
        PRIVATE = 'private', "Privée"
    
    slug = models.SlugField(primary_key=True, blank=True)
    name = models.CharField(max_length=120)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='repositories')
    access = models.CharField(max_length=20, choices=Access.choices)
    description = models.TextField(blank=True, null=True)
    language = models.CharField(max_length=60, blank=True, default='')
    language_color = models.CharField(max_length=7, blank=True, default='')
    topics = models.JSONField(default=list, blank=True)
    size_bytes = models.PositiveBigIntegerField(default=0)
    archived = models.BooleanField(default=False)
    license_template = models.CharField(max_length=50, null=True, blank=True,)
    gitignore_template = models.CharField(max_length=60, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Dépôt"
        ordering = ['-updated_at', '-created_at']
        constraints = [
            models.UniqueConstraint(fields=['owner', 'name'], name='unique_repository_name_per_owner')
        ]    
        
    def __str__(self) -> str:
        return f"{self.owner}/{self.name}"

    @property
    def default_branch(self) -> str:
        try:
            return self.settings.default_branch
        except RepositorySettings.DoesNotExist:
            return "main"
        
    def save(self, *args, **kwargs) -> None:
        if len(self.slug) == 0:
            base_slug = self.owner.username + '__' + slugify(self.name)[:90]
            candidate = base_slug
            suffix = 2
            
            while Repository.objects.exclude(pk=self.pk).filter(slug=candidate).exists():
                candidate = f"{base_slug[:90]}-{suffix}"
                suffix += 1
                
            self.slug = candidate
        super().save(*args, **kwargs)
        
    
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
    labels = models.JSONField(default=list, blank=True)
    type = models.CharField(max_length=20, choices=Type.choices, default=Type.BUG)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='issues')
    submitted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['submitted_at', 'pk']
        
    @property
    def relative_id(self) -> int:
        return self.repo.issues.filter(
            Q(submitted_at__lt=self.submitted_at)
            | Q(submitted_at=self.submitted_at, pk__lte=self.pk)
        ).count()
        
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
        OPEN = 'open', "Ouverte"
        MERGED = 'merged', "Fusionnée"
        CLOSED = 'closed', "Fermée"

    repo = models.ForeignKey(Repository, on_delete=models.CASCADE, related_name='pull_requests')
        
    title = models.CharField(max_length=120)
    description = models.TextField()
    source_branch = models.CharField(max_length=60)
    target_branch = models.CharField(max_length=60)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    issue = models.OneToOneField(Issue, on_delete=models.SET_NULL, related_name='pull_request', blank=True, null=True)
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='pull_requests')
    submitted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-submitted_at',]

    @property
    def relative_id(self) -> int:
        return self.repo.pull_requests.filter(
            Q(submitted_at__lt=self.submitted_at)
            | Q(submitted_at=self.submitted_at, pk__lte=self.pk)
        ).count()
        
    def __str__(self) -> str:
        return f"{self.title} par {self.submitted_by.username}" + (f" a résolu {self.issue.relative_id}" if getattr(self, 'issue', None) else "")


# Star model    
class Star(models.Model):
    repo = models.ForeignKey(Repository, on_delete=models.CASCADE, related_name='stars')
    starred_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='repository_stars')
    starred_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-starred_at', 'starred_by']
        constraints = [
            models.UniqueConstraint(fields=['repo', 'starred_by'], name='unique_repository_star_per_user'),
        ]
        
    def __str__(self) -> str:
        return f"{self.repo} aimé par {self.starred_by} à {self.starred_at}"
    
    
# Fork model
class Fork(models.Model):
    repo = models.ForeignKey(Repository, on_delete=models.CASCADE, related_name='forks')
    forked_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    forked_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-forked_at', 'forked_by']
        constraints = [
            models.UniqueConstraint(fields=['repo', 'forked_by'], name='unique_repository_fork_per_user'),
        ]
        
    def __str__(self) -> str:
        return f"{self.repo} forké par {self.forked_by} à {self.forked_at}"
    
    
# Watcher model
class Watcher(models.Model):
    repo = models.ForeignKey(Repository, on_delete=models.CASCADE, related_name='watchers')
    watched_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    watched_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-watched_at', 'watched_by']
        constraints = [
            models.UniqueConstraint(fields=['repo', 'watched_by'], name='unique_repository_watch_per_user'),
        ]
        
    def __str__(self) -> str:
        return f"{self.repo} surveillé par {self.watched_by} à {self.watched_at}"