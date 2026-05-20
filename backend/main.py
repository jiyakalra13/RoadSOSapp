import os
import json
import time
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests

app = FastAPI(title="RoadSOS Python Backend API")

# Enable CORS for maximum flexibility in dev environment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Environment Setup ---
def load_env():
    """Load environment variables from root .env.local if present."""
    env_path = Path(__file__).resolve().parent.parent / ".env.local"
    if env_path.exists():
        print(f"[ENV] Loading environment variables from {env_path}")
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip()
    else:
        print("[WARN] No .env.local found in project root. Running with system env variables.")

load_env()

# --- JSON Database Persistence ---
DATA_DIR = Path(__file__).resolve().parent / "data"
USERS_FILE = DATA_DIR / "users.json"
ALERTS_FILE = DATA_DIR / "alerts.json"
VOICE_ALERTS_FILE = DATA_DIR / "voice_alerts.json"
DANGER_LOGS_FILE = DATA_DIR / "danger_logs.json"

def ensure_data_dir():
    """Ensure data files and directory exist."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not USERS_FILE.exists():
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump([], f)
    if not ALERTS_FILE.exists():
        with open(ALERTS_FILE, "w", encoding="utf-8") as f:
            json.dump([], f)
    if not VOICE_ALERTS_FILE.exists():
        with open(VOICE_ALERTS_FILE, "w", encoding="utf-8") as f:
            json.dump([], f)
    if not DANGER_LOGS_FILE.exists():
        with open(DANGER_LOGS_FILE, "w", encoding="utf-8") as f:
            json.dump([], f)

def read_danger_logs() -> list:
    ensure_data_dir()
    try:
        with open(DANGER_LOGS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def write_danger_logs(logs: list):
    ensure_data_dir()
    with open(DANGER_LOGS_FILE, "w", encoding="utf-8") as f:
        json.dump(logs, f, indent=2, ensure_ascii=False)

def read_users() -> list:
    ensure_data_dir()
    try:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def write_users(users: list):
    ensure_data_dir()
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2, ensure_ascii=False)

def read_alerts() -> list:
    ensure_data_dir()
    try:
        with open(ALERTS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def write_alerts(alerts: list):
    ensure_data_dir()
    with open(ALERTS_FILE, "w", encoding="utf-8") as f:
        json.dump(alerts, f, indent=2, ensure_ascii=False)

def read_voice_alerts() -> list:
    ensure_data_dir()
    try:
        with open(VOICE_ALERTS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def write_voice_alerts(alerts: list):
    ensure_data_dir()
    with open(VOICE_ALERTS_FILE, "w", encoding="utf-8") as f:
        json.dump(alerts, f, indent=2, ensure_ascii=False)

# --- Pydantic Data Models (Matching Next.js Frontend precisely) ---
class EmergencyContact(BaseModel):
    id: str
    name: str
    phone: str
    relationship: str

class UserProfile(BaseModel):
    fullName: str
    phone: str
    countryCode: str
    dateOfBirth: str
    gender: Optional[str] = ""
    bloodGroup: str
    allergies: str
    medicalConditions: str
    medications: str
    emergencyContacts: List[EmergencyContact] = []
    vehicleNumber: Optional[str] = ""
    vehicleModel: Optional[str] = ""
    hasCompletedOnboarding: bool = False
    createdAt: Optional[str] = ""
    updatedAt: Optional[str] = ""

class LocationData(BaseModel):
    lat: float
    lng: float
    address: Optional[str] = None
    timestamp: Optional[float] = None

class SOSAlertPayload(BaseModel):
    userId: str
    triggerType: str
    location: Optional[LocationData] = None
    time: str
    contacts: List[EmergencyContact] = []
    status: str
    messageBody: Optional[str] = ""

class VoiceSOSPayload(BaseModel):
    triggerType: str
    timestamp: Optional[str] = None
    location: Optional[LocationData] = None
    sosStatus: str

# --- API Router Endpoints ---

# --- Profile Endpoints ---
@app.get("/api/user/profile")
def get_profile(phone: Optional[str] = None):
    """Retrieve user profile. Optionally filter by phone, else returns active profile."""
    users = read_users()
    if phone:
        for user in users:
            if user.get("phone") == phone:
                return user
        raise HTTPException(status_code=404, detail=f"Profile with phone '{phone}' not found")
    
    if users:
        # Default to the most recently active profile
        return users[0]
    
    raise HTTPException(status_code=404, detail="No profile has been created yet")

@app.post("/api/user/profile")
def save_profile(profile: UserProfile):
    """Save or update user profile details in our persistent JSON database."""
    users = read_users()
    profile_dict = profile.dict()
    now_str = datetime.utcnow().isoformat() + "Z"
    
    # Check if a profile with the same phone already exists
    existing_idx = -1
    for idx, user in enumerate(users):
        if user.get("phone") == profile.phone:
            existing_idx = idx
            break
            
    if existing_idx >= 0:
        # Preserve original creation date
        profile_dict["createdAt"] = users[existing_idx].get("createdAt", now_str)
        profile_dict["updatedAt"] = now_str
        users[existing_idx] = profile_dict
        msg = "Profile updated successfully"
    else:
        # Create a new profile entry
        profile_dict["id"] = f"user-{int(time.time() * 1000)}"
        profile_dict["createdAt"] = now_str
        profile_dict["updatedAt"] = now_str
        # Insert at the beginning so get_profile returns it as default
        users.insert(0, profile_dict)
        msg = "Profile created successfully"
        
    write_users(users)
    return {"success": True, "message": msg, "profile": profile_dict}

# --- SOS Trigger & SMS Routing Endpoints ---
@app.post("/api/sos/send-alert")
def send_sos_alert(payload: SOSAlertPayload):
    """Log active SOS alert and trigger SMS broadcasts via Fast2SMS to emergency contacts."""
    alerts = read_alerts()
    alert_dict = payload.dict()
    alert_dict["server_timestamp"] = datetime.utcnow().isoformat() + "Z"
    
    # Save the alert in history
    alerts.insert(0, alert_dict)
    write_alerts(alerts)
    
    print(f"[ALERT] EMERGENCY ALERT LOGGER: Triggered '{payload.triggerType}' for user '{payload.userId}'")
    
    api_key = os.environ.get("FAST2SMS_API_KEY")
    sms_results = []
    
    # Loop over contacts and attempt dispatching
    for contact in payload.contacts:
        phone = contact.phone
        name = contact.name
        
        # Clean phone numbers to last 10 digits (digits only)
        clean_phone = "".join([c for c in phone if c.isdigit()])
        if len(clean_phone) > 10:
            clean_phone = clean_phone[-10:]
            
        if len(clean_phone) != 10:
            sms_results.append({
                "contactName": name,
                "contactPhone": phone,
                "status": "failed",
                "error": "Invalid phone number length"
            })
            continue
            
        message_body = payload.messageBody or f"[ALERT] EMERGENCY ALERT! {payload.userId} may be in danger and has triggered RoadSOS."
        
        if not api_key:
            # Simulated sending if offline or key is missing
            print(f"[!] SIMULATED SMS to {name} ({clean_phone}): {message_body}")
            sms_results.append({
                "contactName": name,
                "contactPhone": phone,
                "status": "simulated",
                "message": message_body
            })
            continue
            
        # Deliver via Fast2SMS API
        try:
            response = requests.post(
                "https://www.fast2sms.com/dev/bulkV2",
                headers={
                    "authorization": api_key,
                    "Content-Type": "application/json"
                },
                json={
                    "route": "q",
                    "message": message_body,
                    "flash": 0,
                    "numbers": clean_phone
                },
                timeout=8
            )
            res_data = response.json()
            if res_data.get("return"):
                print(f"[SUCCESS] Fast2SMS dispatch successful for {name} ({clean_phone})")
                sms_results.append({
                    "contactName": name,
                    "contactPhone": phone,
                    "status": "sent",
                    "data": res_data
                })
            else:
                print(f"[ERROR] Fast2SMS dispatch error for {name}: {res_data}")
                sms_results.append({
                    "contactName": name,
                    "contactPhone": phone,
                    "status": "failed",
                    "error": "Fast2SMS API returned failure",
                    "data": res_data
                })
        except Exception as e:
            print(f"[FATAL] Failed to call Fast2SMS for {name}: {e}")
            sms_results.append({
                "contactName": name,
                "contactPhone": phone,
                "status": "failed",
                "error": str(e)
            })
            
    return {
        "success": True,
        "message": "SOS Alert recorded and processed",
        "alert": alert_dict,
        "sms_results": sms_results
    }

@app.get("/api/sos/history")
def get_sos_history():
    """Retrieve historical logs of active SOS events."""
    return read_alerts()

@app.post("/api/voice-sos")
def log_voice_sos(payload: VoiceSOSPayload):
    """Log a hands-free voice or scream emergency trigger event."""
    alerts = read_voice_alerts()
    alert_dict = payload.dict()
    if not alert_dict.get("timestamp"):
        alert_dict["timestamp"] = datetime.utcnow().isoformat() + "Z"
    
    # Save the voice alert in history
    alerts.insert(0, alert_dict)
    write_voice_alerts(alerts)
    
    print(f"[ALERT] VOICE EMERGENCY LOGGER: Triggered voice SOS '{payload.triggerType}', status: '{payload.sosStatus}'")
    return {"success": True, "message": "Voice SOS logged successfully", "data": alert_dict}

@app.get("/api/voice-sos/history")
def get_voice_sos_history():
    """Retrieve historical logs of voice/scream SOS events."""
    return read_voice_alerts()

# --- Accident-Prone Area Safety API Endpoints ---
class DangerCheckPayload(BaseModel):
    lat: float
    lng: float

DANGER_ZONES = [
  {
    "id": "zone-1",
    "name": "NH-8 Intersection Junction",
    "lat": 28.6139,
    "lng": 77.2090,
    "radius": 300,
    "riskLevel": "high",
    "confidence": 0.92,
    "trafficDensity": "high",
    "poorLighting": True,
    "description": "Frequent multi-vehicle pileups due to abrupt merge lanes and poor illumination at night."
  },
  {
    "id": "zone-2",
    "name": "Western Express Curve",
    "lat": 19.0760,
    "lng": 72.8777,
    "radius": 250,
    "riskLevel": "high",
    "confidence": 0.88,
    "trafficDensity": "high",
    "poorLighting": False,
    "description": "Sharp blind turn with high speed limits, prone to skidding during rain."
  },
  {
    "id": "zone-3",
    "name": "Outer Ring Road Blind Corner",
    "lat": 12.9716,
    "lng": 77.5946,
    "radius": 200,
    "riskLevel": "high",
    "confidence": 0.85,
    "trafficDensity": "moderate",
    "poorLighting": True,
    "description": "Narrow curve with construction zones and blocked visibility."
  },
  {
    "id": "zone-4",
    "name": "Sector 62 Crossing",
    "lat": 28.6273,
    "lng": 77.3725,
    "radius": 300,
    "riskLevel": "high",
    "confidence": 0.89,
    "trafficDensity": "high",
    "poorLighting": False,
    "description": "Heavy commercial traffic and lack of clear lane markings."
  },
  {
    "id": "zone-5",
    "name": "Mock Simulator Danger Zone",
    "lat": 0.0,
    "lng": 0.0,
    "radius": 1000,
    "riskLevel": "high",
    "confidence": 0.95,
    "trafficDensity": "low",
    "poorLighting": True,
    "description": "Default mock location for development environment testing."
  }
]

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    import math
    R = 6371000.0 # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

@app.get("/api/danger/zones")
def get_danger_zones():
    """Retrieve predefined danger zones."""
    return {"success": True, "zones": DANGER_ZONES}

@app.post("/api/danger/check")
def check_danger_location(payload: DangerCheckPayload):
    """Check coordinates and log check results."""
    lat = payload.lat
    lng = payload.lng
    
    detected_zone = None
    min_distance = float('inf')
    
    for zone in DANGER_ZONES:
        dist = calculate_distance(lat, lng, zone["lat"], zone["lng"])
        if dist <= zone["radius"]:
            if dist < min_distance:
                min_distance = dist
                detected_zone = zone
                
    in_danger_zone = detected_zone is not None
    risk_level = detected_zone["riskLevel"] if in_danger_zone else "low"
    confidence = detected_zone["confidence"] if in_danger_zone else 0.12
    zone_name = detected_zone["name"] if in_danger_zone else "Safe Area"
    
    log_record = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "location": {"lat": lat, "lng": lng},
        "riskLevel": risk_level,
        "confidence": confidence,
        "zoneName": zone_name,
        "inDangerZone": in_danger_zone,
        "distanceToZone": round(min_distance) if in_danger_zone else None
    }
    
    # Save log
    logs = read_danger_logs()
    logs.insert(0, log_record)
    # Cap at last 500 records
    if len(logs) > 500:
        logs = logs[:500]
    write_danger_logs(logs)
    
    return {
        "success": True,
        "inDangerZone": in_danger_zone,
        "riskLevel": risk_level,
        "confidence": confidence,
        "zoneName": zone_name,
        "log": log_record
    }

# --- Health Check ---
@app.get("/health")
def health_check():
    """Service health state check."""
    return {"status": "healthy", "service": "RoadSOS Python API Backend"}
