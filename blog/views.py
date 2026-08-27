from django.shortcuts import render, get_object_or_404 , redirect
from .models import Camera, Zone
from .registration import UserRegistrationForm
from .loginf import UserLoginForm
from .cameraf import CameraForm
from .zonef import ZoneForm
from django.contrib.auth import login, logout
import json
from detection.models import Alert

def mainpage(request):
    cameras = Camera.objects.all()
    active_cameras_count = Camera.objects.filter(status="active").count()  # ✅ only active
    zones = Zone.objects.all()
    form = CameraForm()
    alerts_count = Alert.objects.count()
    system_status = "Fire Detected" if alerts_count > 0 else "Operational"

    zones_json = []
    for zone in zones:
        try:
            coords = json.loads(zone.polygon)  # parse JSON string to list
        except json.JSONDecodeError:
            coords = []  # or skip or handle error

        zones_json.append({
            'name': zone.name,
            'coords': coords
        })

    return render(request, 'blog/content.html',{'form': form, 'cameras': cameras,'zones_json': zones_json,'alerts_count': alerts_count,'system_status': system_status, "active_cameras_count": active_cameras_count, })

def registeruser(request):
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('login')  # Redirect to login page or homepage
    else:
        form = UserRegistrationForm()

    return render(request, 'blog/register.html', {'form': form})

def userlogin(request):
    if request.method == "POST":
        form = UserLoginForm(request.POST)
        if form.is_valid():
            user=form.user
            login(request, form.user)
            return redirect('mainpage')  # Change 'home' to your desired redirect URL name
    else:
        form = UserLoginForm()
    return render(request, 'blog/login.html', {'form': form})

def logoutuser(request):
    logout(request)
    return redirect('mainpage')


def newcamera(request):
    if request.method == 'POST':
        form = CameraForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('mainpage')  # your URL name
    else:
        form = CameraForm()

    return render(request, 'blog/Content.html', {'form': form})


def add_zone(request):
    if request.method == 'POST':
        form = ZoneForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('mainpage')
        else:
            print(form.errors)  # Debug any validation errors
    return redirect('mainpage')


def delete_camera(request, camera_id):
    if request.method == 'POST':
        camera = get_object_or_404(Camera, id=camera_id)
        camera.delete()
    return redirect('mainpage')  # Replace with your homepage/map view name

def delete_zone(request):
    if request.method == 'POST':
        zone_name = request.POST.get('name')
        if zone_name:
            zone = get_object_or_404(Zone, name=zone_name)
            zone.delete()
    return redirect('mainpage')  # your redirect after deletion






















def my_view(request):
    if request.user.is_authenticated:
        username = request.user.username
        # use `username` in your logic or pass it to template context
    else:
        username = None
    return render(request, 'blog/Fire.html', {'username': username})