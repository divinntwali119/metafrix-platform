from django.db import models

# Event model
class Event(models.Model):
    name = models.CharField(max_length=130)
    description = models.TextField()
    image = models.ImageField(upload_to='events/image/', null=True, blank=True)
    organisator = models.ForeignKey('collaborations.Organisation')

    class Meta:
        verbose_name = "Evenement"
        
    def __str__(self) -> str:
        return f"{self.name} par {self.organisator}"