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
  voiceCommandEnabled: true, // Enabled by default for hands-free SOS
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
  "i need help",
  "sos",
  "save me",
  "accident",
  "crash",
  "call for help"
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
  micPermission: "prompt" | "granted" | "denied"
  requestMicrophonePermission: () => Promise<boolean>
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
  const [micPermission, setMicPermission] = useState<"prompt" | "granted" | "denied">("prompt")
  const [isSupported, setIsSupported] = useState({
    voice: false,
    volume: true, // Volume detection via keydown is widely supported
    crash: false
  })

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const volumePressTimesRef = useRef<number[]>([])
  const onTriggerRef = useRef(onTrigger)

  // Track if voice recognition should be running
  const shouldListenRef = useRef(false)
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasRequestedMicRef = useRef(false)

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

  // Check for API support and request microphone permission
  useEffect(() => {
    if (typeof window === "undefined") return

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    
    setIsSupported({
      voice: !!SpeechRecognitionAPI,
      volume: true,
      crash: "DeviceMotionEvent" in window
    })

    // Check and request microphone permission
    if (navigator.permissions) {
      navigator.permissions.query({ name: "microphone" as PermissionName }).then(result => {
        setMicPermission(result.state as "prompt" | "granted" | "denied")
        result.onchange = () => {
          setMicPermission(result.state as "prompt" | "granted" | "denied")
        }
      }).catch(() => {
        // Permissions API not fully supported, will request on first use
      })
    }
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

  // Request microphone permission and start voice recognition
  const requestMicrophonePermission = useCallback(async () => {
    if (hasRequestedMicRef.current) return
    hasRequestedMicRef.current = true
    
    try {
      // Request microphone access - this will prompt the user
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Stop the stream immediately, we just needed permission
      stream.getTracks().forEach(track => track.stop())
      setMicPermission("granted")
      return true
    } catch {
      setMicPermission("denied")
      return false
    }
  }, [])

  // Initialize voice recognition for SOS commands - auto-starts when enabled
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!settings.voiceCommandEnabled || !enabled) {
      shouldListenRef.current = false
      return
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) return

    shouldListenRef.current = true
    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onstart = () => {
      console.log("[v0] Voice recognition started - listening for commands")
      setIsVoiceListening(true)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript
        console.log("[v0] Heard:", transcript)
        
        if (checkForSOSCommand(transcript)) {
          console.log("[v0] SOS COMMAND DETECTED:", transcript)
          setLastDetectedCommand(transcript)
          shouldListenRef.current = false
          onTriggerRef.current("voice")
          recognition.stop()
          return
        }
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.log("[v0] Voice recognition error:", event.error)
      // Don't set listening to false on no-speech errors, just restart
      if (event.error !== "no-speech" && event.error !== "aborted") {
        setIsVoiceListening(false)
      }
      // If permission denied, request it
      if (event.error === "not-allowed") {
        requestMicrophonePermission()
      }
    }

    recognition.onend = () => {
      console.log("[v0] Voice recognition ended, shouldListen:", shouldListenRef.current)
      setIsVoiceListening(false)
      // Clear any existing restart timeout
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current)
      }
      // Auto-restart if still enabled and should be listening
      if (shouldListenRef.current && settings.voiceCommandEnabled && enabled) {
        restartTimeoutRef.current = setTimeout(() => {
          try {
            console.log("[v0] Restarting voice recognition...")
            recognition.start()
          } catch (e) {
            console.log("[v0] Restart error:", e)
            // If failed due to permission, request it
            requestMicrophonePermission().then(granted => {
              if (granted) {
                try {
                  recognition.start()
                } catch {
                  // Ignore
                }
              }
            })
          }
        }, 300)
      }
    }

    recognitionRef.current = recognition

    // Auto-start voice recognition
    const startRecognition = async () => {
      try {
        console.log("[v0] Starting voice recognition...")
        recognition.start()
      } catch (e) {
        console.log("[v0] Initial start error:", e)
        // Request microphone permission and try again
        const granted = await requestMicrophonePermission()
        if (granted) {
          try {
            recognition.start()
          } catch {
            // Ignore secondary errors
          }
        }
      }
    }

    startRecognition()

    return () => {
      shouldListenRef.current = false
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current)
      }
      recognition.abort()
      recognitionRef.current = null
    }
  }, [settings.voiceCommandEnabled, enabled, checkForSOSCommand, requestMicrophonePermission])

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
    isSupported,
    micPermission,
    requestMicrophonePermission
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
