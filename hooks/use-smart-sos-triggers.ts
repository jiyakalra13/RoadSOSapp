"use client"

import { useState, useEffect, useCallback, useRef } from "react"

// Storage key for smart trigger settings
const SMART_TRIGGERS_STORAGE_KEY = "roadsos_smart_triggers"

export interface SmartTriggerSettings {
  voiceCommandEnabled: boolean
  volumeButtonEnabled: boolean
  crashDetectionEnabled: boolean
  shakeDetectionEnabled: boolean
}

const defaultSettings: SmartTriggerSettings = {
  voiceCommandEnabled: true, // Enabled by default for hands-free SOS
  volumeButtonEnabled: true,
  crashDetectionEnabled: true,
  shakeDetectionEnabled: true
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
  onTrigger: (triggerType: "voice" | "volume" | "crash" | "shake", command?: string) => void
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
    shake: boolean
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
    crash: false,
    shake: false
  })

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const volumePressTimesRef = useRef<number[]>([])
  const onTriggerRef = useRef(onTrigger)

  // Track if voice recognition should be running
  const shouldListenRef = useRef(false)
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasRequestedMicRef = useRef(false)
  const consecutiveErrorsRef = useRef(0)
  const maxConsecutiveErrors = 3 // Stop trying after 3 consecutive errors

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
      crash: "DeviceMotionEvent" in window,
      shake: "DeviceMotionEvent" in window
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
      consecutiveErrorsRef.current = 0 // Reset error counter on successful start
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
          onTriggerRef.current("voice", transcript)
          recognition.stop()
          return
        }
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.log("[v0] Voice recognition error:", event.error)
      consecutiveErrorsRef.current++
      
      // Don't set listening to false on no-speech errors, just restart
      if (event.error !== "no-speech" && event.error !== "aborted") {
        setIsVoiceListening(false)
      }
      
      // If permission denied or too many errors, stop trying to restart
      if (event.error === "not-allowed") {
        shouldListenRef.current = false // Stop restart loop
        setMicPermission("denied")
        console.log("[v0] Microphone permission denied - stopping voice recognition")
      }
    }

    recognition.onend = () => {
      console.log("[v0] Voice recognition ended, shouldListen:", shouldListenRef.current)
      setIsVoiceListening(false)
      // Clear any existing restart timeout
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current)
      }
      // Auto-restart if still enabled, should be listening, and haven't hit error limit
      if (shouldListenRef.current && settings.voiceCommandEnabled && enabled && consecutiveErrorsRef.current < maxConsecutiveErrors) {
        restartTimeoutRef.current = setTimeout(() => {
          try {
            console.log("[v0] Restarting voice recognition...")
            recognition.start()
          } catch (e) {
            console.log("[v0] Restart error:", e)
            consecutiveErrorsRef.current++
            // Stop trying if we've hit the error limit
            if (consecutiveErrorsRef.current >= maxConsecutiveErrors) {
              console.log("[v0] Too many consecutive errors, stopping voice recognition")
              shouldListenRef.current = false
            }
          }
        }, 300)
      } else if (consecutiveErrorsRef.current >= maxConsecutiveErrors) {
        console.log("[v0] Stopping voice recognition due to repeated errors")
      }
    }

    recognitionRef.current = recognition

    // Auto-start voice recognition only if we have permission or haven't been denied
    const startRecognition = async () => {
      // Don't start if permission was already denied
      if (micPermission === "denied") {
        console.log("[v0] Skipping voice recognition - microphone permission denied")
        shouldListenRef.current = false
        return
      }
      
      try {
        console.log("[v0] Starting voice recognition...")
        recognition.start()
      } catch (e) {
        console.log("[v0] Initial start error:", e)
        consecutiveErrorsRef.current++
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

  // Crash & Shake detection via accelerometer
  useEffect(() => {
    if ((!settings.crashDetectionEnabled && !settings.shakeDetectionEnabled) || !enabled) return
    if (typeof window === "undefined" || !("DeviceMotionEvent" in window)) return

    let lastAcceleration = { x: 0, y: 0, z: 0 }
    let lastTime = Date.now()
    let shakeCount = 0
    let lastShakeTime = 0
    
    const CRASH_THRESHOLD = 30 // G-force threshold for crash detection
    const SHAKE_THRESHOLD = 15 // G-force threshold for shake
    const SHAKE_TIMEOUT = 1000 // Reset shake count after 1s
    const REQUIRED_SHAKES = 4 // Number of shakes required

    const handleMotion = (event: DeviceMotionEvent) => {
      const acceleration = event.accelerationIncludingGravity
      if (!acceleration || acceleration.x === null) return

      const deltaX = Math.abs((acceleration.x || 0) - lastAcceleration.x)
      const deltaY = Math.abs((acceleration.y || 0) - lastAcceleration.y)
      const deltaZ = Math.abs((acceleration.z || 0) - lastAcceleration.z)
      
      const totalDelta = Math.sqrt(deltaX ** 2 + deltaY ** 2 + deltaZ ** 2)
      const now = Date.now()

      if (settings.crashDetectionEnabled && totalDelta > CRASH_THRESHOLD) {
        onTriggerRef.current("crash")
      }

      if (settings.shakeDetectionEnabled && totalDelta > SHAKE_THRESHOLD) {
        if (now - lastTime > 100) { // Debounce
          if (now - lastShakeTime > SHAKE_TIMEOUT) {
            shakeCount = 0 // reset if too much time passed
          }
          shakeCount++
          lastShakeTime = now
          
          if (shakeCount >= REQUIRED_SHAKES) {
            shakeCount = 0
            onTriggerRef.current("shake")
          }
        }
      }

      lastAcceleration = {
        x: acceleration.x || 0,
        y: acceleration.y || 0,
        z: acceleration.z || 0
      }
      lastTime = now
    }

    window.addEventListener("devicemotion", handleMotion)
    return () => window.removeEventListener("devicemotion", handleMotion)
  }, [settings.crashDetectionEnabled, settings.shakeDetectionEnabled, enabled])

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
