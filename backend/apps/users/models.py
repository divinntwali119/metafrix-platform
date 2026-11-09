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
         
    expertise_domain = models.CharField(max_length=60, choices=Domain.choices)
        
    REQUIRED_FIELDS = AbstractUser.REQUIRED_FIELDS + ['expertise_domain']

    class Meta:
        ordering = ['username']
        constraints = [
            models.UniqueConstraint(fields=['username', 'email'], name='unique_username_or_email_per_user')
        ]
        
    def __str__(self) -> str:
        return self.get_username()
    