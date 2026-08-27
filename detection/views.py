from django.shortcuts import render
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
from pathlib import Path
import shutil, os

from .models import Alert
from ultralytics import YOLO

# ✅ Load YOLO model once (faster)
model = YOLO("C:/Users/test1/Documents/Stage/Django/best8.pt")


def run_detection(request):
    detection_result = None
    alerts = Alert.objects.all().order_by("-created_at")
    system_status = "Operational"

    if request.method == "POST" and request.FILES.get("image"):
        image_file = request.FILES["image"]

        # Save uploaded image temporarily
        temp_path = default_storage.save("temp/" + image_file.name, ContentFile(image_file.read()))
        abs_temp_path = default_storage.path(temp_path)

        # Run YOLO detection
        results = model.predict(
            abs_temp_path,
            save=True,
            project="runs/detect",
            name="fire_results",
            exist_ok=True
        )
        detection_result = {"status": "no_fire"}

        for r in results:
            for box in r.boxes:
                conf = float(box.conf[0])
                if conf > 0.3:  # Threshold
                    severity = "high" if conf > 0.8 else "medium"

                    output_path = Path(r.save_dir) / os.path.basename(abs_temp_path)

                    # Save annotated image into MEDIA/alerts
                    media_output_dir = Path(settings.MEDIA_ROOT) / "alerts"
                    media_output_dir.mkdir(parents=True, exist_ok=True)
                    media_output_path = media_output_dir / output_path.name
                    shutil.copy(output_path, media_output_path)

                    rel_path = os.path.relpath(media_output_path, settings.MEDIA_ROOT)

                    # Save alert in DB
                    alert = Alert.objects.create(
                        camera_id="Camera1",
                        confidence=conf,
                        severity=severity,
                        image=rel_path
                    )

                    detection_result = {
                        "status": "fire",
                        "confidence": conf,
                        "severity": severity,
                        "image": alert.image.url,
                    }
                    break
            if detection_result["status"] == "fire":
                break

        # Update status
        system_status = "Fire Detected" if detection_result["status"] == "fire" else "Operational"

        # Clean temp
        if default_storage.exists(temp_path):
            default_storage.delete(temp_path)

        # ✅ After POST → go to results.html
        return render(request, "detection/results.html", {
            "detection_result": detection_result,
            "alerts": alerts,
            "system_status": system_status,
        })

    # ✅ If GET → show upload.html
    return render(request, "detection/upload.html")
