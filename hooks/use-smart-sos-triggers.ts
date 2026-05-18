"use client"

import { useState, useEffect, useCallback, useRef } from "react"

// Storage key for smart trigger settings
const SMART_TRIGGERS_STORAGE_KEY = "roadsos_smart_triggers"

export interface SmartTriggerSettings {
  voiceCommandEnabled: boolean
  volumeButtonEnabled: boolean
  crashDetectionEnabled: boolean
}

const defaultSettings: SmartTriggerSettings = {
  voiceCommandEnabled: false,
  volumeButtonEnabled: true,
  crashDetectionEnabled: true
}

// Voice command phrases that trigger SOS
const SOS_VOICE_COMMANDS = [
  "help me",
  "help",
  "roadsos activate",
  "road sos activate",
  "call ambulance",
  "emergency",
  "call police",
  "i need help"
]

interface UseSmartSOSTriggersOptions {
  onTrigger: (triggerType: "voice" | "volume" | "crash") => void
  enabled?: boolean
}

interface SmartSOSTriggersResult {
  settings: SmartTriggerSettings
  updateSettings: (settings: Partial<SmartTriggerSettings>) => void
  isVoiceListening: boolean
  startVoiceListening: () => void
  stopVoiceListening: () => void
  lastDetectedCommand: string | null
  isSupported: {
    voice: boolean
    volume: boolean
    crash: boolean
  }
}

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: {
    length: number
    [index: number]: {
      isFinal: boolean
      [index: number]: {
        transcript: string
        confidence: number
      }
    }
  }
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

export function useSmartSOSTriggers({
  onTrigger,
  enabled = true
}: UseSmartSOSTriggersOptions): SmartSOSTriggersResult {
  const [settings, setSettings] = useState<SmartTriggerSettings>(defaultSettings)
  const [isVoiceListening, setIsVoiceListening] = useState(false)
  const [lastDetectedCommand, setLastDetectedCommand] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState({
    voice: false,
    volume: true, // Volume detection via keydown is widely supported
    crash: false
  })

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const volumePressTimesRef = useRef<number[]>([])
  const onTriggerRef = useRef(onTrigger)

  // Keep trigger ref updated
  useEffect(() => {
    onTriggerRef.current = onTrigger
  }, [onTrigger])

  // Load settings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SMART_TRIGGERS_STORAGE_KEY)
      if (stored) {
        setSettings(JSON.parse(stored))
      }
    } catch {
      // Use defaults
    }
  }, [])

  // Check for API support
  useEffect(() => {
    if (typeof window === "undefined") return

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    
    setIsSupported({
      voice: !!SpeechRecognitionAPI,
      volume: true,
      crash: "DeviceMotionEvent" in window
    })
  }, [])

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<SmartTriggerSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings }
      localStorage.setItem(SMART_TRIGGERS_STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  // Check if transcript contains SOS command
  const checkForSOSCommand = useCallback((transcript: string): boolean => {
    const normalized = transcript.toLowerCase().trim()
    return SOS_VOICE_COMMANDS.some(cmd => normalized.includes(cmd))
  }, [])

  // Initialize voice recognition for SOS commands
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!settings.voiceCommandEnabled || !enabled) return

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) return

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onstart = () => {
      setIsVoiceListening(true)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript
        
        if (checkForSOSCommand(transcript)) {
          setLastDetectedCommand(transcript)
          onTriggerRef.current("voice")
          recognition.stop()
          return
        }
      }
    }

    recognition.onerror = () => {
      setIsVoiceListening(false)
    }

    recognition.onend = () => {
      setIsVoiceListening(false)
      // Auto-restart if still enabled
      if (settings.voiceCommandEnabled && enabled) {
        setTimeout(() => {
          try {
            recognition.start()
          } catch {
            // Ignore restart errors
          }
        }, 1000)
      }
    }

    recognitionRef.current = recognition

    return () => {
      recognition.abort()
      recognitionRef.current = null
    }
  }, [settings.voiceCommandEnabled, enabled, checkForSOSCommand])

  // Volume button detection (3 quick presses)
  useEffect(() => {
    if (!settings.volumeButtonEnabled || !enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for volume up or volume down keys
      if (event.key === "AudioVolumeUp" || event.key === "AudioVolumeDown" || 
          event.key === "VolumeUp" || event.key === "VolumeDown") {
        const now = Date.now()
        volumePressTimesRef.current.push(now)
        
        // Keep only presses within the last 2 seconds
        volumePressTimesRef.current = volumePressTimesRef.current.filter(
          time => now - time < 2000
        )
        
        // Check for 3 quick presses (within 1.5 seconds)
        if (volumePressTimesRef.current.length >= 3) {
          const timeDiff = volumePressTimesRef.current[volumePressTimesRef.current.length - 1] - 
                          volumePressTimesRef.current[volumePressTimesRef.current.length - 3]
          
          if (timeDiff < 1500) {
            volumePressTimesRef.current = []
            onTriggerRef.current("volume")
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [settings.volumeButtonEnabled, enabled])

  // Crash detection via accelerometer
  useEffect(() => {
    if (!settings.crashDetectionEnabled || !enabled) return
    if (typeof window === "undefined" || !("DeviceMotionEvent" in window)) return

    let lastAcceleration = { x: 0, y: 0, z: 0 }
    const CRASH_THRESHOLD = 30 // G-force threshold for crash detection

    const handleMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity
      if (!acceleration || acceleration.x === null) return

      const deltaX = Math.abs((acceleration.x || 0) - lastAcceleration.x)
      const deltaY = Math.abs((acceleration.y || 0) - lastAcceleration.y)
      const deltaZ = Math.abs((acceleration.z || 0) - lastAcceleration.z)
      
      const totalDelta = Math.sqrt(deltaX ** 2 + deltaY ** 2 + deltaZ ** 2)

      if (totalDelta > CRASH_THRESHOLD) {
        onTriggerRef.current("crash")
      }

      lastAcceleration = {
        x: acceleration.x || 0,
        y: acceleration.y || 0,
        z: acceleration.z || 0
      }
    }

    window.addEventListener("devicemotion", handleMotion)
    return () => window.removeEventListener("devicemotion", handleMotion)
  }, [settings.crashDetectionEnabled, enabled])

  const startVoiceListening = useCallback(() => {
    if (!recognitionRef.current || isVoiceListening) return
    try {
      recognitionRef.current.start()
    } catch {
      // Already started
    }
  }, [isVoiceListening])

  const stopVoiceListening = useCallback(() => {
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.stop()
    } catch {
      // Already stopped
    }
  }, [])

  return {
    settings,
    updateSettings,
    isVoiceListening,
    startVoiceListening,
    stopVoiceListening,
    lastDetectedCommand,
    isSupported
  }
}

// Export settings functions for use in settings screen
export function loadSmartTriggerSettings(): SmartTriggerSettings {
  if (typeof window === "undefined") return defaultSettings
  try {
    const stored = localStorage.getItem(SMART_TRIGGERS_STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {
    // Use defaults
  }
  return defaultSettings
}

export function saveSmartTriggerSettings(settings: SmartTriggerSettings): void {
  if (typeof window === "undefined") return
  localStorage.setItem(SMART_TRIGGERS_STORAGE_KEY, JSON.stringify(settings))
}
