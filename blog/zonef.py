from django import forms
from .models import Zone

class ZoneForm(forms.ModelForm):
    class Meta:
        model = Zone
        fields = ['name', 'polygon']
        widgets = {
            'polygon': forms.HiddenInput()
        }