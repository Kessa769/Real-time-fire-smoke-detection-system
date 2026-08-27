from django.urls import path
from . import views

urlpatterns = [
    path("detect/", views.run_detection, name="run_detection"),

]
