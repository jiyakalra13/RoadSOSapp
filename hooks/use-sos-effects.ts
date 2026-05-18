"use client"

import { useRef, useCallback, useEffect } from "react"

interface SOSEffectsOptions {
  beepFrequency?: number // Hz
  beepDuration?: number // ms
  beepInterval?: number // ms between beeps
  vibrationPattern?: number[] // vibration pattern
}

const DEFAULT_OPTIONS: SOSEffectsOptions = {
  beepFrequency: 880, // A5 note - attention-grabbing
  beepDuration: 200,
  beepInterval: 600,
  vibrationPattern: [200, 100, 200, 100, 400], // SOS-like pattern
}

export function useSOSEffects(options: SOSEffectsOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const beepIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const vibrationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isPlayingRef = useRef(false)

  // Initialize audio context on first interaction
  const initAudio = useCallback(() => {
    if (audioContextRef.current) return audioContextRef.current
    
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass()
      }
    } catch (e) {
      console.warn("Audio not supported:", e)
    }
    
    return audioContextRef.current
  }, [])

  // Play a single beep
  const playBeep = useCallback(() => {
    const audioContext = initAudio()
    if (!audioContext) return

    try {
      // Resume audio context if suspended (browser autoplay policy)
      if (audioContext.state === "suspended") {
        audioContext.resume()
      }

      // Create oscillator for the beep
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.type = "square" // Harsh, attention-grabbing sound
      oscillator.frequency.setValueAtTime(config.beepFrequency!, audioContext.currentTime)

      // Envelope for the beep (attack, sustain, release)
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01) // Quick attack
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + (config.beepDuration! / 1000) - 0.05)
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + (config.beepDuration! / 1000)) // Release

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + (config.beepDuration! / 1000))

      oscillatorRef.current = oscillator
      gainNodeRef.current = gainNode
    } catch (e) {
      console.warn("Error playing beep:", e)
    }
  }, [initAudio, config.beepFrequency, config.beepDuration])

  // Start vibration pattern
  const vibrate = useCallback(() => {
    if ("vibrate" in navigator) {
      try {
        navigator.vibrate(config.vibrationPattern!)
      } catch (e) {
        console.warn("Vibration not supported:", e)
      }
    }
  }, [config.vibrationPattern])

  // Start repeating effects (beep + vibration)
  const startEffects = useCallback(() => {
    if (isPlayingRef.current) return
    isPlayingRef.current = true

    // Play initial beep and vibrate
    playBeep()
    vibrate()

    // Set up repeating beep
    beepIntervalRef.current = setInterval(() => {
      playBeep()
    }, config.beepInterval!)

    // Set up repeating vibration
    vibrationIntervalRef.current = setInterval(() => {
      vibrate()
    }, 1000) // Vibrate every second
  }, [playBeep, vibrate, config.beepInterval])

  // Stop all effects
  const stopEffects = useCallback(() => {
    isPlayingRef.current = false

    // Clear intervals
    if (beepIntervalRef.current) {
      clearInterval(beepIntervalRef.current)
      beepIntervalRef.current = null
    }

    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current)
      vibrationIntervalRef.current = null
    }

    // Stop vibration
    if ("vibrate" in navigator) {
      try {
        navigator.vibrate(0)
      } catch {
        // Ignore errors when stopping vibration
      }
    }

    // Stop any playing oscillator
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop()
      } catch {
        // Ignore if already stopped
      }
      oscillatorRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopEffects()
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }, [stopEffects])

  return {
    startEffects,
    stopEffects,
    playBeep,
    vibrate,
    isPlaying: isPlayingRef.current,
  }
}
