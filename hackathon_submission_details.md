# 🛡️ Hackathon Submission Report: RoadSOS
**The National Road Safety Hackathon 2026**
*Organised by the Centre of Excellence for Road Safety (CoERS) & RBG Labs, IIT Madras*

---

## 📋 1. Project Metadata & Team Details
*   **Application Name**: RoadSOS
*   **Hackathon Track**: Topic 3 — **RoadSoS** (*Location-based access to trauma centres, ambulances, vehicle rescue services, police stations, and emergency contacts*)
*   **Core Theme**: AI in Road Safety (Proactive Accident Hazard Prediction & Automated Emergency Rescue Coordination)
*   **Submission Format**: Technical Project Report (Word Document) + Complete Source Code Folder (Submitted as `.zip` archive)
*   **Evaluation Focus**: Proactive AI Collision Avoidance, Seamless Golden-Hour Coordination, Offline Resilience, and Universal Device Accessibility.

---

## 💡 2. Project Executive Summary
RoadSOS is a premium, state-of-the-art Progressive Web App (PWA) designed to dramatically cut down trauma response times during the **"Golden Hour"** and proactively prevent accidents altogether. 

By continuously analyzing live GPS telemetry against a simulated **AI/ML Accident Danger Zone Prediction Engine**, RoadSOS alerts the driver 8 seconds *before* entering critical accident-prone zones using dynamic visual cues and hands-free text-to-speech warnings. 

If an accident occurs, RoadSOS provides an automatic, hands-free sequential calling cascade (first calling the area-specific ambulance, and then automatically calling local emergency services/police when the user returns to focus), logs telemetry to the backend, broadcasts coordinates via SMS, and runs an offline-ready first aid helper.

All source code files required to compile, build, and run both the web client and backend services are fully provided in the accompanying `.zip` submission file.

---

## 📂 3. Architectural Classification (Frontend, Backend & APIs)

To provide the evaluation committee with a structured overview of our system, we have classified the entire **RoadSOS** codebase into three core divisions: **The Frontend Client**, **The Backend Microservice**, and **The API Integration Layer**.

### 📱 A. The Frontend Client (Next.js / React Single-Page Application)
The frontend is responsible for the interactive, PWA-compliant mobile-first client interface, live telemetry coordinate tracking, hardware triggers, and hands-free audio synthesis:

*   **Main Application Shell & Pages**:
    *   `app/page.tsx`: The primary orchestrator. Coordinates user onboarding states, route views, GPS hooks, network checkers, and binds trigger events to active screens.
    *   `app/globals.css`: Declares the core visual tokens, harmonic dark mode variables, and CSS-based micro-animations.
    *   `app/layout.tsx`: Configures the document structure, responsive viewport optimizations, PWA meta headers, and global font sets.
*   **Interactive UI Components (`components/`)**:
    *   `home-dashboard.tsx`: Home UI rendering the active danger warning banner cards, transition safe alerts, dynamic location highlights, and safety mode controls.
    *   `sos-flow.tsx`: Core active emergency screen handling countdown canvases, pulsating beep animations, and the sequential dialer (Ambulance followed by Police).
    *   `sos-confirmation-overlay.tsx`: Interactive widget to review and abort smart triggers before broadcasting.
    *   `nearby-services.tsx` & `services-overview.tsx`: Locate trauma centers, ambulances, police, and mechanics.
    *   `interactive-map.tsx`: Displays interactive maps with high-risk corridor overlays and emergency hospital pinpoints.
    *   `first-aid-chat.tsx`: Offline-ready conversational aid assistant for hemorrhage control and CPR steps.
    *   `safewalk-mode.tsx` & `fake-call-setup.tsx` / `fake-call-screen.tsx`: Safety deterrence tools (walk check-ins and decoy callers).
    *   `network-status-indicator.tsx`, `pwa-install-prompt.tsx`, `bottom-nav.tsx`, `onboarding-screen.tsx`, `profile-screen.tsx`, `settings-screen.tsx`.
*   **Custom Client Lifecycle Hooks (`hooks/`)**:
    *   `use-danger-zones.ts`: Periodically checks coordinates against the prediction API, coordinates the 8s display timers, and manages the 60s speech alert cooldowns.
    *   `use-smart-sos-triggers.ts`: Establishes hardware listeners (shake triggers, simulated crash inputs, volume key combinations) and speech recognition keyword matchers.
    *   `use-location.ts` (GPS watcher), `use-user-profile.ts` (Profile sync), `use-network-status.ts` (Connection tracking), `use-emergency-sms.ts` (SMS broker).

---

### 🖥️ B. The Backend Microservice (Python FastAPI Framework)
The backend functions as a high-performance computation layer, running location algorithms and acting as the secure persistence database:

*   **Core Logic & Engine**:
    *   `backend/main.py`: Configures the FastAPI web framework, enables CORS middleware, implements the **Haversine Proximity Algorithm**, performs risk level evaluations, and serves REST requests.
    *   `backend/requirements.txt`: Manages backend python package dependencies (fastapi, uvicorn, requests, pydantic).
*   **JSON Persistent Database (`backend/data/`)**:
    *   `danger_logs.json`: Telemetry history auditing database storing user check coordinate timestamps and risk scores.
    *   `users.json`: Secure repository preserving registered user profiles and medical metadata.
    *   `alerts.json`: Active SOS incident records logs.
    *   `voice_alerts.json`: Records voice transcribed trigger history.

---

### 📡 C. The API Integration Layer (Next.js Handlers & FastAPI Endpoints)
The API layer is completely mirrored across both runtimes (Python FastAPI and Next.js Serverless Route Handlers) to ensure absolute deployment versatility:

| Endpoint Route | HTTP Method | System Context | Data Payload (Payload Model) | Persistent Database File |
| :--- | :---: | :--- | :--- | :--- |
| **`/api/danger/zones`** | `GET` | Pulls pre-mapped dangerous high-risk road corridors | Returns high-risk coordinates, radius, traffic indices, and light ratings | *Static database read* |
| **`/api/danger/check`** | `POST` | Live location checking and ML risk model computations | `{ lat: float, lng: float }` | `danger_logs.json` |
| **`/api/user/profile`** | `GET` | Fetches registered profile configuration | Returns user profile, emergency contacts list, and blood type | `users.json` |
| **`/api/user/profile`** | `POST` | Saves/updates user profile configuration | Full `UserProfile` JSON data payload | `users.json` |
| **`/api/sos/send-alert`** | `POST` | Broadcasts emergency coordinates and alerts emergency contacts | `{ lat: float, lng: float, active: bool }` | `alerts.json` |
| **`/api/sos/history`** | `GET` | Audits historical SOS incidents | List of all triggered emergency alert objects | `alerts.json` |
| **`/api/voice-sos`** | `POST` | Logs voice keyword recognition alerts | `{ triggerType: "voice", sosStatus: "active", location: {} }` | `voice_alerts.json` |
| **`/api/voice-sos/history`**| `GET` | Pulls voice keyword trigger logs | List of transcribed voice incident entries | `voice_alerts.json` |
| **`/health`** | `GET` | Backend system integration healthcheck | Returns `{"status": "healthy"}` | *System status check* |

---

## 📦 5. Software Package & Dependency Directory

### A. Next.js Frontend Framework (Next.js 16 / React 19)
1.  **Next.js (`next`)**: Serves as the core React framework.
2.  **React & ReactDOM (`react`, `react-dom`)**: Controls declarative component UI states.
3.  **TypeScript (`typescript`)**: Enforces compile-time type-safety for complex coordinate data arrays.
4.  **TailwindCSS & PostCSS (`tailwindcss`, `postcss`)**: Handles modern, fluid styling, high-contrast visual safety cards, and responsiveness.
5.  **Framer Motion (`framer-motion`)**: Manages high-performance CSS animations (spring-based sliding warning alerts, pulsating danger glows, and tab transitions).
6.  **Lucide React (`lucide-react`)**: Provides clean, universally recognizable safety and emergency iconography (Shield, Ambulance, Flame, MessageSquare, AlertTriangle).
7.  **Web Speech API (Native Web API)**:
    *   *SpeechSynthesis*: Handles hands-free Text-to-Speech (TTS) voice announcements.
    *   *SpeechRecognition*: Facilitates offline/hands-free keyword parsing for voice-initiated SOS commands.

### B. Python FastAPI Backend Framework (Python 3.10+)
1.  **FastAPI**: A modern, high-performance web framework for building REST APIs with Python.
2.  **Uvicorn**: An ASGI web server implementation for high-throughput, low-latency API serving.
3.  **Pydantic**: Performs rigorous data validation and settings management using python type annotations.
4.  **Requests**: Facilitates external service callouts and logging operations.

---

## 🧠 6. Architectural & Development Assumptions

When developing RoadSOS, the following key engineering assumptions and constraints were established:

1.  **Golden Hour Dialing Limitation (Browser Sandboxing)**:
    *   *Constraint*: Web browsers restrict triggering multiple concurrent outbound telephone calls to protect against automated dial spam, and redirecting focus exits the browser container.
    *   *Assumption/Solution*: Designed a **State-Aware Visibility Sequence**. When SOS activates, the app immediately redirects to the Ambulance (`window.location.href = "tel:..."`). The app schedules the next dial to local police/emergency services to trigger *only* when the document regains visibility (`document.visibilityState === "visible"`). This fulfills both dialing requirements successfully without triggering security sandbox errors.
2.  **AI Danger Zone Model Parameters**:
    *   *Assumption*: The predictive model computes location danger ratings based on Euclidean coordinate distances calculated via the high-accuracy **Haversine Formula**.
    *   *Parameters*: A radius threshold of 150m to 300m is assumed for historical hotspots. The risk score is determined by:
        $$\text{Risk Score} = w_1 \cdot \text{Proximity} + w_2 \cdot \text{Traffic Density} + w_3 \cdot \text{Illumination Index} + w_4 \cdot \text{Historical Weight}$$
3.  **Audio Autoplay Constraints**:
    *   *Constraint*: Modern browsers block audio/speech output until a user interacts with the page (clicks/taps).
    *   *Assumption*: Because RoadSOS is an active dashboard where users tap "Start Safety Mode", trigger Onboarding, or activate voice listeners, user-consent interaction is established before alerts fire, ensuring Speech Synthesis operates reliably.
4.  **Network Disconnection (Offline Resilience)**:
    *   *Assumption*: Network signal is highly volatile on rural highways where accidents are common.
    *   *Solution*: The app utilizes local caching structures (`localStorage`) to query last known safety data, logs critical alerts in offline queues, and registers PWA service workers to keep the entire interface fully operational without network access.

---

## 🛠️ 7. Setup & Compilation Guide (From the Submitted `.zip` Folder)

### Section 1: Next.js Frontend Deployment
Extract the `.zip` archive and navigate to the root directory `RoadSOSapp/`:
```bash
# 1. Install all dependencies
npm install

# 2. Build the optimized production bundles
npm run build

# 3. Start the application locally
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

### Section 2: Python Backend Deployment
Navigate to the `backend/` folder:
```bash
# 1. Initialize virtual environment
python -m venv venv
.\venv\Scripts\activate   # Windows
source venv/bin/activate  # MacOS/Linux

# 2. Install all required packages
pip install -r requirements.txt

# 3. Launch the API server
uvicorn main:app --reload --port 8000
```
API Documentation and Interactive Swagger Spec is accessible at `http://localhost:8000/docs`.

---

## 📝 8. Key Source Code Implementations (Highlights)

To demonstrate our implementation techniques directly within this report, we have extracted key algorithmic blocks from the submitted `.zip` codebase:

### A. Intelligent Proximity & Risk Prediction Algorithm (from `backend/main.py`)
```python
def calculate_haversine(lat1, lon1, lat2, lon2):
    import math
    R = 6371000  # Radius of Earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(delta_lambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c  # Returns distance in meters
```

### B. Sequential Auto-Calling Logic on Active SOS (from `components/sos-flow.tsx`)
```typescript
useEffect(() => {
  if (!isActive || step !== "active") return;

  const handleAutoCalls = () => {
    if (!hasCalledAmbulanceRef.current) {
      hasCalledAmbulanceRef.current = true;
      speak("Calling ambulance now.");
      setTimeout(() => {
        callPhone(emergencyNumbers.ambulance);
      }, 1000);
    } else if (hasCalledAmbulanceRef.current && !hasCalledContactRef.current) {
      hasCalledContactRef.current = true;
      const localEmergencyService = emergencyNumbers.police || emergencyNumbers.general || "112";
      const serviceLabel = localEmergencyService === "100" || localEmergencyService === "911" ? "police" : "emergency services";
      speak(`Calling area ${serviceLabel} now.`);
      setTimeout(() => {
        callPhone(localEmergencyService);
      }, 1000);
    }
  };

  handleAutoCalls();

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      handleAutoCalls();
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("focus", handleAutoCalls);

  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("focus", handleAutoCalls);
  };
}, [isActive, step, emergencyNumbers.ambulance, emergencyNumbers.police, emergencyNumbers.general]);
```
