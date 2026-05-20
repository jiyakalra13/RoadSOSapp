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
  "s.o.s.",
  "s o s",
  "road sos",
  "roadsos",
  "please help",
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
  spokenText: string
  startVoiceListening: () => void
  stopVoiceListening: () => void
  lastDetectedCommand: string | null
  audioLevel: number
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
  const [isAudioListening, setIsAudioListening] = useState(false)
  const [isSpeechListening, setIsSpeechListening] = useState(false)
  const isVoiceListening = isAudioListening || isSpeechListening
  const [spokenText, setSpokenText] = useState<string>("")
  const [lastDetectedCommand, setLastDetectedCommand] = useState<string | null>(null)
  const [audioLevel, setAudioLevel] = useState<number>(0)
  const [micPermission, setMicPermission] = useState<"prompt" | "granted" | "denied">("prompt")
  const transcriptTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isSupported, setIsSupported] = useState({
    voice: false,
    volume: true, // Volume detection via keydown is widely supported
    crash: false,
    shake: false
  })

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const volumePressTimesRef = useRef<number[]>([])
  const isResettingVolumeRef = useRef(false)
  const onTriggerRef = useRef(onTrigger)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const microphoneStreamRef = useRef<MediaStream | null>(null)
  const animationFrameIdRef = useRef<number | null>(null)

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

  // Load settings from localStorage and listen to updates
  useEffect(() => {
    const load = () => {
      try {
        const stored = localStorage.getItem(SMART_TRIGGERS_STORAGE_KEY)
        if (stored) {
          setSettings(JSON.parse(stored))
        }
      } catch {
        // Use defaults
      }
    }
    load()

    // Detect if microphone permission has already been granted (useful on iOS Safari)
    const checkInitialPermission = async () => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices) return
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const hasLabel = devices.some(d => d.kind === "audioinput" && d.label !== "")
        if (hasLabel) {
          setMicPermission("granted")
        }
      } catch (e) {
        console.log("[v0] Error checking device labels:", e)
      }
    }
    checkInitialPermission()

    window.addEventListener("roadsos_settings_updated", load)
    window.addEventListener("storage", load)
    return () => {
      window.removeEventListener("roadsos_settings_updated", load)
      window.removeEventListener("storage", load)
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
    
    // 1. Check if the transcript contains any of the exact multi-word key phrases
    const hasPhraseMatch = SOS_VOICE_COMMANDS.some(cmd => normalized.includes(cmd))
    if (hasPhraseMatch) return true

    // 2. Clean punctuation and split the spoken text into individual words
    const words = normalized.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").split(/\s+/)
    
    // Define a set of emergency keywords that we want to match individually
    const targetKeywords = new Set([
      "help",
      "sos",
      "emergency",
      "ambulance",
      "police",
      "save",
      "accident",
      "crash",
      "activate",
      "danger"
    ])
    
    // Check if any single word spoken by the user is in our target keywords set
    return words.some(word => targetKeywords.has(word))
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

  const startScreamDetection = useCallback(async () => {
    if (microphoneStreamRef.current || audioContextRef.current) return

    try {
      console.log("[v0] Initializing scream detection Web Audio context...")
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      microphoneStreamRef.current = stream
      setIsAudioListening(true)

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return

      const audioContext = new AudioContextClass()
      audioContextRef.current = audioContext

      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser

      source.connect(analyser)

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      let screamTicks = 0
      const SCREAM_THRESHOLD = 0.38
      const REQUIRED_SCREAM_TICKS = 4

      const checkVolume = () => {
        if (!analyserRef.current) return

        analyserRef.current.getByteTimeDomainData(dataArray)

        let sum = 0
        for (let i = 0; i < bufferLength; i++) {
          const deviation = (dataArray[i] - 128) / 128
          sum += deviation * deviation
        }
        const rms = Math.sqrt(sum / bufferLength)
        
        setAudioLevel(Math.min(rms * 2.5, 1.0))

        if (rms > SCREAM_THRESHOLD) {
          screamTicks++
          if (screamTicks >= REQUIRED_SCREAM_TICKS) {
            console.log("[v0] SCREAM DETECTED! Volume RMS:", rms)
            screamTicks = 0
            
            onTriggerRef.current("voice", "Loud Scream Detected")
            
            fetch("/api/voice-sos", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                triggerType: "scream",
                sosStatus: "triggered",
                location: null
              })
            }).catch(err => console.warn("Failed to log scream event:", err))
          }
        } else {
          screamTicks = Math.max(0, screamTicks - 1)
        }

        animationFrameIdRef.current = requestAnimationFrame(checkVolume)
      }

      checkVolume()
    } catch (err) {
      console.warn("Failed to start scream detection AudioContext:", err)
      setIsAudioListening(false)
    }
  }, [])

  const stopScreamDetection = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current)
      animationFrameIdRef.current = null
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close()
      } catch {}
      audioContextRef.current = null
    }
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach(track => track.stop())
      microphoneStreamRef.current = null
    }
    analyserRef.current = null
    setAudioLevel(0)
    setIsAudioListening(false)
  }, [])

  // Scream detection lifecycle: auto-start when mic permission is granted and feature is enabled
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!settings.voiceCommandEnabled || !enabled || micPermission !== "granted") {
      stopScreamDetection()
      return
    }

    startScreamDetection()

    return () => {
      stopScreamDetection()
    }
  }, [settings.voiceCommandEnabled, enabled, micPermission, startScreamDetection, stopScreamDetection])

  // Initialize voice recognition for SOS commands - auto-starts when enabled and permission granted
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!settings.voiceCommandEnabled || !enabled || micPermission !== "granted") {
      shouldListenRef.current = false
      setIsSpeechListening(false)
      return
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      console.log("[v0] Speech recognition API not supported in this browser.")
      return
    }

    shouldListenRef.current = true
    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onstart = () => {
      console.log("[v0] Voice recognition started - listening for commands")
      setIsSpeechListening(true)
      consecutiveErrorsRef.current = 0 // Reset error counter on successful start
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ""
      let interimTranscript = ""
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript
        if (result.isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      const currentSpeech = interimTranscript || finalTranscript
      if (currentSpeech.trim()) {
        setSpokenText(currentSpeech.trim())
        if (transcriptTimeoutRef.current) clearTimeout(transcriptTimeoutRef.current)
        transcriptTimeoutRef.current = setTimeout(() => {
          setSpokenText("")
        }, 3000)
      }

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript
        console.log("[v0] Heard:", transcript)
        
        if (checkForSOSCommand(transcript)) {
          console.log("[v0] SOS COMMAND DETECTED:", transcript)
          setLastDetectedCommand(transcript)
          setSpokenText(transcript)
          shouldListenRef.current = false
          onTriggerRef.current("voice", transcript)
          recognition.stop()

          fetch("/api/voice-sos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              triggerType: "voice",
              sosStatus: "triggered",
              location: null
            })
          }).catch(err => console.warn("Failed to log voice event:", err))
          
          return
        }
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.log("[v0] Voice recognition error:", event.error)
      
      // Only treat unexpected errors as consecutive failures
      if (event.error !== "no-speech" && event.error !== "aborted" && event.error !== "audio-capture") {
        consecutiveErrorsRef.current++
        setIsSpeechListening(false)
      }
      
      if (event.error === "not-allowed") {
        shouldListenRef.current = false
        setMicPermission("denied")
        console.log("[v0] Microphone permission denied - stopping voice recognition")
      }
    }

    recognition.onend = () => {
      console.log("[v0] Voice recognition ended, shouldListen:", shouldListenRef.current)
      setIsSpeechListening(false)
      
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current)
      }
      
      if (shouldListenRef.current && settings.voiceCommandEnabled && enabled) {
        restartTimeoutRef.current = setTimeout(() => {
          try {
            console.log("[v0] Restarting voice recognition...")
            recognition.start()
          } catch (e) {
            console.log("[v0] Restart error:", e)
          }
        }, 300)
      }
    }

    recognitionRef.current = recognition

    const startRecognition = () => {
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
      try {
        recognition.abort()
      } catch {}
      recognitionRef.current = null
      setIsSpeechListening(false)
    }
  }, [settings.voiceCommandEnabled, enabled, checkForSOSCommand, requestMicrophonePermission])

  // Volume button detection (3 quick presses)
  // Since PWAs cannot natively detect hardware keys, we use a silent audio hack for Android.
  useEffect(() => {
    if (!settings.volumeButtonEnabled || !enabled) return
    if (typeof window === "undefined") return

    // 1-second silent WAV audio data URI
    const silentAudioSrc = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"
    
    const audio = new Audio(silentAudioSrc)
    audio.loop = true
    audio.playsInline = true
    // Set to 0.5 so we can detect volume changes in both directions
    audio.volume = 0.5 

    // We must wait for first user interaction to play the audio
    const startAudio = () => {
      audio.play().catch(() => {
        // Browser might still block it, silently fail
      })
      // Remove listeners after first interaction
      document.removeEventListener("touchstart", startAudio)
      document.removeEventListener("click", startAudio)
    }

    document.addEventListener("touchstart", startAudio)
    document.addEventListener("click", startAudio)

    const handleVolumeChange = () => {
      // If this event was fired because WE reset the volume, ignore it
      if (isResettingVolumeRef.current) {
        isResettingVolumeRef.current = false
        return
      }

      // Reset volume to 0.5 so we can keep detecting changes in the same direction
      if (audio.volume !== 0.5) {
        isResettingVolumeRef.current = true
        audio.volume = 0.5
      }

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

    audio.addEventListener("volumechange", handleVolumeChange)

    return () => {
      document.removeEventListener("touchstart", startAudio)
      document.removeEventListener("click", startAudio)
      audio.removeEventListener("volumechange", handleVolumeChange)
      audio.pause()
      audio.src = ""
    }
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
    spokenText,
    startVoiceListening,
    stopVoiceListening,
    lastDetectedCommand,
    audioLevel,
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
