# 🔥 Fire & Smoke Detection System

> A dual-layer fire and smoke detection system combining **Edge AI on Raspberry Pi 4** with a **Django-based web monitoring platform**.

---

## 📌 Overview

The system combines two complementary components:

- **Edge AI Detection Unit:** A Raspberry Pi 4 connected to a CSI camera performs local, real-time fire and smoke detection using YOLOv5n.
- **Web-Based Monitoring Platform:** A Django application integrates YOLOv8n to process uploaded images, generate detection results, manage alerts, and visualize surveillance cameras and zones.

This dual architecture explores the use of lightweight computer vision models both on an embedded device and within a centralized web application.

---

# 🏗️ System Architecture

The project is divided into two main branches:

```text
                         SMART FOR GREEN
                    FIRE & SMOKE DETECTION
                              │
               ┌──────────────┴──────────────┐
               │                             │
               ▼                             ▼
      ┌───────────────────┐        ┌─────────────────────┐
      │   EDGE AI UNIT    │        │   WEB APPLICATION   │
      └───────────────────┘        └─────────────────────┘
               │                             │
               ▼                             ▼
        Raspberry Pi 4                    Django
               │                             │
               ▼                       HTML / CSS
          CSI Camera                       │
               │                           ▼
               ▼                    YOLOv8n Inference
          Picamera2                       │
               │                           ▼
               ▼                    Detection Results
           YOLOv5n                         │
               │                           ├── Bounding Boxes
               ▼                           ├── Confidence
      Fire / Smoke Detection               └── Threat Level
               │                             │
               ▼                             ▼
            OpenCV                   Alert Management
               │                             │
               ▼                             ├── Camera Management
       Local Visualization                  ├── Zone Management
                                           └── System Status
                                                 │
                                                 ▼
                                            Leaflet.js
                                                 │
                                                 ▼
                                      Camera / Zone Mapping
