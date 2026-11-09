from django.db import models
from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.core.serializers.json import DjangoJSONEncoder

class AuditLog(models.Model):
    class DangerDegree(models.TextChoices):
        LOW = '1', "Dangerosite faible"
        AVERAGE = '2', "Dangerosite moyenne"
        HIGH = '3', "Dangerosite elevee"
        # No backup action
        VERY_HIGH = '4', "Dangerosite tres elevee pas de moyen d'annulation"
        
    class Action(models.TextChoices):
        CREATE = 'create', "Creation"
        UPDATE = 'update', "Modification"
        DELETE = 'delete', "Suppression"
        
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='action_logs')
    danger_degree = models.CharField(max_length=60, choices=DangerDegree.choices)
    action = models.CharField(max_length=30, choices=Action.choices) 
    target_slug = models.SlugField(max_length=120)
    target_type = models.CharField(max_length=60)
    before = models.JSONField(encoder=DjangoJSONEncoder, blank=True, null=True)
    after = models.JSONField(encoder=DjangoJSONEncoder, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at', '-id']
        default_permissions = ('view', )
        verbose_name = "Journal d'audit"
        verbose_name_plural = "Journal d'audit"
        
    def save(self, *args, **kwargs) -> None:
        if not self._state.adding:
            raise PermissionDenied("Un journal d'audit ne peut pas être modifié.")
        super().save(*args, **kwargs)
        
    def delete(self, *args, **kwargs) -> None:
        raise PermissionDenied("Un journal d'audit ne peut pas être supprimé.")
    
    def __str__(self) -> str:   
        return f"{self.created_at:%Y-%m-%d %H:%M} | {self.actor} | {self.action} | {self.target_type}"
    
    