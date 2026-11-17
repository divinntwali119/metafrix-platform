import uuid

from django.db import models
from django.conf import settings
from django.utils.text import slugify


# Organisation model
class Organisation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True, default="")
    website = models.URLField(max_length=2048, blank=True, default="")
    location = models.CharField(max_length=160, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.DO_NOTHING)
    image_profile = models.ImageField(upload_to='organisations/images/', null=True, blank=True) 
    
    class Meta:
        ordering = ['name',]
        
    def __str__(self) -> str:
        return f"{self.name} | {self.created_by}"

    def save(self, *args, **kwargs) -> None:
        if not self.slug:
            base_slug = slugify(self.name)[:90] or "organisation"
            candidate = base_slug
            
            suffix = 2
            while Organisation.objects.exclude(pk=self.pk).filter(slug=candidate).exists():
                candidate = f"{base_slug[:90]}-{suffix}"
                suffix += 1
                
            self.slug = candidate
        super().save(*args, **kwargs)


# Organisation user link
class OrganisationMembership(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Role(models.TextChoices):
        OWNER = "owner", "Propriétaire"
        ADMIN = "admin", "Administrateur"
        MEMBER = "member", "Membre"

    organisation = models.ForeignKey(Organisation, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="organisation_memberships")
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.MEMBER)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at", "pk"]
        constraints = [
            models.UniqueConstraint(fields=["organisation", "user"], name="unique_organisation_member"),
        ]


# Repository that belongs to an organisation
class OrganisationRepository(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    organisation = models.ForeignKey(Organisation, on_delete=models.CASCADE, related_name='repository_links')
    repository = models.ForeignKey("repositories.Repository", on_delete=models.CASCADE, related_name='organisation_links')
    added_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='organisation_repository_links')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=['organisation', 'repository'], name='unique_repository_per_organisation'),
        ]

        
# Team model
class Team(models.Model):
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    name = models.CharField(max_length=100)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    organisation = models.ForeignKey(Organisation, on_delete=models.CASCADE, related_name='teams', null=True, blank=True)
    image_profile = models.ImageField(upload_to='teams/images/', null=True, blank=True)
    
    class Meta:
        verbose_name = "Equipe"
        
    def save(self, *args, **kwargs) -> None:
        if not self.slug:
            organisation_slug = self.organisation.slug if self.organisation_id else ''
            base_slug = slugify(f'{organisation_slug}-{self.name}')[:100] or 'team'
            candidate = base_slug
            suffix = 2
            
            while Team.objects.exclude(pk=self.pk).filter(slug=candidate).exists():
                suffix_text = f'-{suffix}'
                candidate = f"{base_slug[:100 - len(suffix_text)]}{suffix_text}"
                suffix += 1
                
            self.slug = candidate
        super().save(*args, **kwargs)
        
    def __str__(self) -> str:
        return self.name


# Team member model
class Member(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='team_links')
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='members')
    role = models.CharField(max_length=40)
    tag = models.CharField(max_length=20, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Membre"
    
    def __str__(self) -> str:
        return f"{self.user.username} | {self.tag if len(self.tag.strip()) == 0 else self.role}"
    
    
############################################### TEAM SPACE MODELS ###############################################

# Board
class Board(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    repo = models.OneToOneField(
        'repositories.Repository',
        on_delete=models.SET_NULL,
        related_name='board',
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=100)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='spaces')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    deadline = models.DateField(blank=True, null=True)
    
    class Meta:
        verbose_name = "Tableau"
        verbose_name_plural = "Tableaux"
        ordering = ['-updated_at', '-created_at']
        constraints = [
            models.UniqueConstraint(fields=['name', 'team'], name='unique_name_per_team')
        ]
        
    def __str__(self) -> str:
        return f"{self.name} | {self.team.name}"


# Attachment model
class Attachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    file = models.FileField(upload_to='boards/files/')
    board = models.ForeignKey(Board, on_delete=models.PROTECT, related_name='files')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(Member, on_delete=models.DO_NOTHING, related_name='attachments')
    
    class Meta:
        verbose_name = "Pièce jointe"
        verbose_name_plural = "Pièces jointes"
        ordering = ['-uploaded_at',]
        
    def __str__(self) -> str:
        return f"{self.file.name} | {self.board.name}"
    
    
# Note model
class Note(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class CardColor(models.TextChoices):
        RED = 'red', "Rouge"
        GREEN = 'green', "Vert"
        BLUE = 'blue', "Bleu"
        YELLOW = 'yellow', "Jaune"
        ORANGE = 'orange', "Orange"
        PURPLE = 'purple', "Violet"
        GREY = 'grey', "Gris"
        
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    board = models.ForeignKey(Board, on_delete=models.PROTECT, related_name='notes')
    author = models.ForeignKey(Member, on_delete=models.PROTECT, related_name='notes', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    color = models.CharField(max_length=20, choices=CardColor.choices, default=CardColor.GREY)
    
    class Meta:
        verbose_name = "Note"
        verbose_name_plural = "Notes"
        ordering = ['-updated_at', '-created_at']
        constraints = [
            models.UniqueConstraint(fields=['title', 'board'], name='unique_title_per_board'),
        ]
        
    def __str__(self) -> str:
        return f"{self.title} | {self.board.name}"


# ToDoList model
class ToDoList(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    assigned_to = models.ForeignKey(Member, on_delete=models.PROTECT, related_name='todo_lists', null=True, blank=True)
    board = models.ForeignKey(Board, on_delete=models.PROTECT, related_name='todo_lists')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    deadline = models.DateField(blank=True, null=True)
    completed = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Liste de tâches"
        verbose_name_plural = "Listes de tâches"
        ordering = ['-updated_at', '-created_at']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(deadline__gte=models.F('created_at')),
                name='task_deadline_after_created_at'
            ),
        ]
        
    def __str__(self) -> str:
        return f" Liste de tâches: {self.title}"


# Task model
class Task(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    todo_list = models.ForeignKey(ToDoList, on_delete=models.PROTECT, related_name='subtasks')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    completed = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Élément de liste de tâches"
        verbose_name_plural = "Éléments de liste de tâches"
        ordering = ['-updated_at', '-created_at']
        constraints = [
            models.UniqueConstraint(fields=['title', 'todo_list'], name='unique_title_per_todo_list'),
        ]
        
    def __str__(self) -> str:
        return f"{self.title} | {self.todo_list.title}"