from django.conf import settings
from django.db import models
from django.utils import timezone
from datetime import date

class Camera(models.Model):
    CAMERA_STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('maintenance', 'Under Maintenance'),
        ('offline', 'Offline'),
    ]

    name = models.CharField(max_length=100)
    camera_id = models.CharField(max_length=50, unique=True)
    installed_at = models.DateField(default=date.today)  # Auto-filled 
    location = models.CharField(max_length=100, default="0.0,0.0")   # e.g., "37.2154,10.1357
    status = models.CharField(max_length=20, choices=CAMERA_STATUS_CHOICES, default='active')

    def __str__(self):
        return f"{self.name} ({self.camera_id})"



class Zone(models.Model):
    name = models.CharField(max_length=100)
    polygon = models.TextField()

    def __str__(self):
        return self.name
    
