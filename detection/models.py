from django.db import models

# Create your models here.

class Alert(models.Model):
    camera_id = models.CharField(max_length=100, null=True, blank=True)
    confidence = models.FloatField()
    severity = models.CharField(
        max_length=50,
        choices=[("low", "Low"), ("medium", "Medium"), ("high", "High")]
    )
    image = models.ImageField(upload_to="alerts/")   # snapshot
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Alert ({self.severity}) - {self.confidence:.2f}"
