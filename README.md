# 🛡️ RoadSOS: AI-Powered Emergency Assistance & Hazard Warning System

[![National Road Safety Hackathon 2026](https://img.shields.io/badge/IIT%20Madras-CoERS%20%7C%20RBG%20Labs-blue.svg?style=for-the-badge)](https://coers.iitm.ac.in/)
[![Theme: AI in Road Safety](https://img.shields.io/badge/Hackathon%20Theme-AI%20in%20Road%20Safety-emerald.svg?style=for-the-badge)](#)
[![Track: RoadSoS](https://img.shields.io/badge/Track-RoadSOS-crimson.svg?style=for-the-badge)](#)

Developed for **The National Road Safety Hackathon 2026**, organized by the **Centre of Excellence for Road Safety (CoERS)** and **RBG Labs, IIT Madras**. 

RoadSOS is a premium, comprehensive emergency-response ecosystem designed to solve the critical "Golden Hour" response time and dynamically prevent accidents through real-time predictive Artificial Intelligence.

---

## 📖 Table of Contents
1. [Inspiration & Problem Statement](#-inspiration--problem-statement)
2. [Hackathon Track Alignment](#-hackathon-track-alignment)
3. [Key Features & AI Capabilities](#-key-features--ai-capabilities)
4. [System Architecture](#-system-architecture)
5. [Tech Stack](#-tech-stack)
6. [Getting Started & Installation](#-getting-started--installation)
   - [Next.js Frontend Setup](#1-nextjs-frontend-setup)
   - [Python FastAPI Backend Setup](#2-python-fastapi-backend-setup)
7. [AI Proximity & Prediction Model Details](#-ai-proximity--prediction-model-details)
8. [Authors & Contribution](#-authors--contribution)

---

## 💡 Inspiration & Problem Statement

Every year, millions of lives are impacted by road accidents, many of which occur in pre-identifiable **accident-prone hotspots** due to poor lighting, blind turns, high traffic density, or highway integration joints. Furthermore, when accidents do occur, delayed access to trauma care during the **Golden Hour** (the first hour after a traumatic injury when prompt medical treatment is most likely to prevent death) remains a primary challenge in saving lives.

**RoadSOS** leverages modern web technologies, real-time GPS tracking, browser-native Text-to-Speech/Speech-Recognition, and a robust predictive backend to:
1. **Prevent Accidents Proactively**: Alerting drivers *before* they enter danger zones so they increase alertness and slow down.
2. **Accelerate Trauma Access**: Automatically coordinating instant SOS sequences, locating nearby emergency resources, and supplying localized, offline-first aid companions.

---

## 🏆 Hackathon Track Alignment

Under the theme **“AI in Road Safety”**, RoadSOS attempts the **RoadSoS Track**:
> **RoadSoS Topic:** *“The tool provides location-based access to nearby trauma centres, ambulance services, vehicle rescue services, police stations and emergency contacts during road accidents.”*

We took this mandate further by combining active reactive services with **AI-driven proactive safety features** to prevent the accident from happening in the first place, and making the entire interface premium, fully hands-free, PWA-installable, and resilient to poor network coverage.

---

## ✨ Key Features & AI Capabilities

### 🧠 1. Proactive AI/ML Danger Zone Prediction
*   **Live GPS Monitoring**: Continuously tracks the user's location via high-accuracy Geolocation.
*   **Predictive Proximity Engine**: Computes distance relative to historically dangerous road corridors and calculates a dynamic risk rating.
*   **Bespoke Warning Banners**: When risk level becomes high, a red floating warning banner slides in for exactly `8 seconds` with animated glows and visual cues.
*   **TTS Voice Guidance**: Automatically triggers hands-free Text-to-Speech warning: 
    *   *“⚠️ Accident-Prone Area Ahead. Please stay alert and drive carefully.”*

### 💚 2. Safe Area Transition Alerts
*   **State-Aware Safety Recovery**: Tracks if the user has successfully exited a dangerous zone.
*   **Safe Reached Notification**: Slides in a calm emerald-green card saying *“💚 Safe Area Reached: In safe area now.”* for exactly `8 seconds`.
*   **Voice Confirmation**: Plays TTS voice confirmation: *“In safe area now.”* to avoid unnecessary driver anxiety.

### 🎙️ 3. Smart Hands-Free Voice SOS Triggers
*   **Keyword Extraction**: Listens locally for crucial safety terms (e.g., `"help"`, `"emergency"`, `"accident"`, `"sos"`).
*   **Interactive Voice Commands**: Users can verbally direct the application to dial critical agencies hands-free (e.g., *"call police"*, *"call ambulance"*, *"call fire"*).
*   **SafeWalk Timer Integration**: Automatically adjusts SOS countdown thresholds (from 5s up to 10s) based on the user's safety settings.

### 📲 4. Multi-Modal Emergency Triggers
*   **Physical Power Key / Volume Button Holding**: Immediate trigger pathway that skips countdowns and connects directly to emergency dialers.
*   **Crash / Shake Sensors**: Simulates accelerometer-based crash detection and shake-to-activate inputs for when the user is unable to tap the screen.
*   **SOS Countdown Cancelation**: Offers a customizable window to abort false alarms before broadcasting alerts.

### 🏥 5. Location-Based Nearby Services Directory
*   **Comprehensive Categories**: Direct access to Trauma Centers, Ambulance services, Vehicle Rescue/Mechanics, Police Stations, and personal emergency contacts.
*   **Interactive Maps**: Integrates React Map structures displaying high-risk markers, live hospital nodes, and optimal routing paths.
*   **One-Tap Navigation**: Instant direction redirection and direct phone dialing handlers.

### 💬 6. Offline AI First-Aid Companion
*   **Interactive Chatbot**: Offline-capable conversational guide offering structured aid instructions (hemorrhage control, CPR, burn management).
*   **Resilient Network Syncing**: Uses state detectors to log local alerts and queue notifications if network drops, syncing instantly once connection returns.

---

## 📐 System Architecture

```mermaid
graph TD
    A[Next.js PWA Client] -->|1. Live GPS coordinates| B(useDangerZones Hook)
    B -->|2. Proximity check request| C{Active Route Check}
    C -->|Next.js Router| D[/api/danger/check]
    C -->|Python Backend| E[FastAPI: /api/danger/check]
    
    D & E -->|3. Haversine & Risk calculations| F[(High-Risk Hotspots DB)]
    D & E -->|4. Log event details| G[(danger_logs.json)]
    D & E -->|5. Return danger flags & risk score| B
    
    B -->|6. Trigger warnings if high risk| H[UI Floating Warning Cards]
    B -->|7. Speak text alert| I[Web Speech Synthesis]
    
    A -->|8. Audio input| J[useSmartSOSTriggers]
    J -->|9. Voice trigger match| K[SOS Flow & Countdown]
    K -->|10. Dispatch SMS/Contacts notify| L[/api/sos/notify-contact]
```

---

## 🛠️ Tech Stack

*   **Frontend Core**: HTML5, Next.js 16 (App Router), React, TypeScript.
*   **Styling & Motion**: Vanilla CSS modules, TailwindCSS, Shadcn/ui tokens, Framer Motion.
*   **Audio Orchestration**: Web Speech Synthesis API (TTS), Web Speech Recognition API (STT).
*   **Backend Core**: Python 3.10+, FastAPI, Uvicorn, Pydantic, JSON db persistence.

---

## 🚀 Getting Started & Installation

### 📋 Prerequisites
*   Node.js (v18.x or above)
*   Python (v3.10 or above)
*   npm or pnpm

### 1. Next.js Frontend Setup

1. Clone or navigate to the project directory:
   ```bash
   cd RoadSOSapp
   ```
2. Install the node packages:
   ```bash
   npm install
   ```
3. Set up environment variables inside `.env.local`:
   ```env
   # Add emergency services and default profiles if needed
   NEXT_PUBLIC_DEFAULT_AMBULANCE=102
   NEXT_PUBLIC_DEFAULT_POLICE=100
   ```
4. Run the Next.js development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) on your desktop or mobile browser.

---

### 2. Python FastAPI Backend Setup

RoadSOS comes equipped with a Python backend providing high-performance APIs for location computation, profile syncing, and emergency logging.

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On MacOS/Linux:
   source venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the FastAPI development server using Uvicorn:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
5. You can view the automated Swagger API documentation at [http://localhost:8000/docs](http://localhost:8000/docs).

---

## 🧠 AI Proximity & Prediction Model Details

The backend algorithm evaluates danger levels using a multi-factor risk assessment formula:

$$\text{Risk Score} = w_1 \cdot \text{Proximity} + w_2 \cdot \text{Traffic Density} + w_3 \cdot \text{Illumination Index} + w_4 \cdot \text{Historical Hotspot Weight}$$

### Predefined Hotspot Zones (Sample Data):
| Zone Name | Latitude | Longitude | Radius (m) | Historical Accident Rate | Risk Level |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **IIT Madras Central Junction** | 12.9915 | 80.2301 | 200m | Extremely High | High |
| **Guindy National Park Crossing** | 12.9985 | 80.2220 | 250m | Moderate | High |
| **Kathipara Flyover Corridor** | 13.0067 | 80.2030 | 300m | High | High |
| **Madhya Kailash Intersection** | 13.0062 | 80.2472 | 150m | High | High |
| **Adyar Flyover Junction** | 13.0118 | 80.2520 | 200m | Moderate | High |

If the user's distance calculated via the **Haversine formula** drops below the target zone's radius threshold, the AI warning system fires immediately. 

> [!NOTE]
> All coordinate calculations, voice logging triggers, and active alerts are persisted directly to `data/danger_logs.json` for auditing and compliance tracking.

---

## 🏛️ Organized By
*   **Centre of Excellence for Road Safety (CoERS)**, IIT Madras
*   **RBG Labs**, IIT Madras
*   **Indian Institute of Technology Madras (IITM)**

---

> [!IMPORTANT]
> **Safety Disclaimer**: RoadSOS is developed for Hackathon evaluation. It is highly optimized to run as a Progressive Web App (PWA) on mobile devices to access onboard hardware triggers successfully.
