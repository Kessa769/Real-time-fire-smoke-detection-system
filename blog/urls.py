from django.urls import path
from . import views
from django.contrib.auth.views import LogoutView

urlpatterns = [
    path('', views.mainpage, name='mainpage'),
    path('register/',views.registeruser,name='register'),
    path('login/',views.userlogin,name='login'),
    path('logout/', views.logoutuser, name='logout'),
    path('new-camera/', views.newcamera, name='newcamera'),
    path('delete-camera/<int:camera_id>/', views.delete_camera, name='delete_camera'),
    path('add-zone/', views.add_zone, name='add_zone'),
    path('delete-zone/', views.delete_zone, name='delete_zone'),
]