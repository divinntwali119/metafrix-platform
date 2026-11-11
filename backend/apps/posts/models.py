from django.db import models
from django.conf import settings

# Event model
class Event(models.Model):
    name = models.CharField(max_length=130)
    description = models.TextField()
    image = models.ImageField(upload_to='events/image/', null=True, blank=True)
    organisator = models.ForeignKey('collaborations.Organisation', on_delete=models.CASCADE, related_name='events')
    created_at = models.DateTimeField(auto_now_add=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    class Meta:
        verbose_name = "Evenement"
        ordering = ['name', '-created_at']
        constraints = [
            models.UniqueConstraint(fields=['name', 'organisator'], name='unique_event_name_per_organisator'),
            models.CheckConstraint(
                condition=models.Q(end_date__lte=models.F('start_date')),
                name='event_end_date_must_be_grater_than_start_date'
            )
        ]
        
    def __str__(self) -> str:
        return f"{self.name} par {self.organisator}"
    
class Post(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField()
    posted_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posts')
    posted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['title', '-posted_at']
        
    def __str__(self) -> str:
        return f"{self.posted_by} : {self.title}"
    
class Like(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes', null=True, blank=True)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='likes', null=True, blank=True)
    liked_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.DO_NOTHING, related_name='likes')
    liked_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "J'aime"
        verbose_name_plural = "J'aimes"
        ordering = ['-liked_at', 'post', 'event']
    