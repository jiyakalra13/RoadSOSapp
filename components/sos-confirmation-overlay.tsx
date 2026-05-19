"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, X, Mic, Car, Ambulance, Phone, User, Heart, Pill, AlertCircle, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSOSEffects } from "@/hooks/use-sos-effects"

interface SOSConfirmationOverlayProps {
  isVisible: boolean
  triggerType: "voice" | "volume" | "crash" | null
  detectedCommand?: string | null
  onConfirm: () => void
  onCancel: () => void
  autoConfirmDelay?: number // Auto-confirm after X seconds (for crash detection)
  emergencyNumbers?: { ambulance: string }
  // User profile info for display
  userName?: string
  bloodGroup?: string
  medicalConditions?: string
  allergies?: string
  emergencyContacts?: Array<{ id: string; name: string; phone: string; relationship: string }>
}

export function SOSConfirmationOverlay({
  isVisible,
  triggerType,
  detectedCommand,
  onConfirm,
  onCancel,
  autoConfirmDelay = 10,
  emergencyNumbers = { ambulance: "911" },
  userName,
  bloodGroup,
  medicalConditions,
  allergies,
  emergencyContacts = []
}: SOSConfirmationOverlayProps) {
  const [countdown, setCountdown] = useState(5)
  const [showDetails, setShowDetails] = useState(false)
  const hasCalledRef = useRef(false)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  
  // SOS sound and vibration effects
  const { startEffects, stopEffects, playBeep } = useSOSEffects({
    beepFrequency: 880,
    beepDuration: 200,
    beepInterval: 800,
  })

  // Determine countdown time based on trigger type
  const getCountdownTime = useCallback(() => {
    if (triggerType === "volume" || triggerType === "voice") return 5
    if (triggerType === "crash") return autoConfirmDelay
    return autoConfirmDelay
  }, [triggerType, autoConfirmDelay])

  // Reset countdown and flags when overlay becomes visible
  useEffect(() => {
    if (isVisible) {
      setCountdown(getCountdownTime())
      setShowDetails(false)
      hasCalledRef.current = false
    } else {
      stopEffects()
    }
  }, [isVisible, getCountdownTime, stopEffects])

  // Wake Lock - Keep screen on during confirmation overlay
  useEffect(() => {
    const requestWakeLock = async () => {
      if (isVisible && 'wakeLock' in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen')
        } catch {
          // Wake lock request failed - silently ignore
        }
      }
    }

    const releaseWakeLock = async () => {
      if (wakeLockRef.current) {
        try {
          await wakeLockRef.current.release()
          wakeLockRef.current = null
        } catch {
          // Ignore release errors
        }
      }
    }

    if (isVisible) {
      requestWakeLock()
    } else {
      releaseWakeLock()
    }

    const handleVisibilityChange = () => {
      if (isVisible && document.visibilityState === 'visible') {
        requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      releaseWakeLock()
    }
  }, [isVisible])

  // Start/stop effects based on visibility and trigger type (volume, voice, or crash)
  useEffect(() => {
    if (isVisible && (triggerType === "volume" || triggerType === "crash" || triggerType === "voice")) {
      startEffects()
    } else {
      stopEffects()
    }
    
    return () => {
      stopEffects()
    }
  }, [isVisible, triggerType, startEffects, stopEffects])

  // Play beep on countdown change for volume or voice trigger
  useEffect(() => {
    if (isVisible && (triggerType === "volume" || triggerType === "voice") && countdown > 0) {
      playBeep()
    }
  }, [countdown, isVisible, triggerType, playBeep])

  // Auto-confirm countdown for volume, voice, and crash triggers
  useEffect(() => {
    if (!isVisible || (triggerType !== "crash" && triggerType !== "volume" && triggerType !== "voice")) return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          // For volume or voice trigger, directly activate SOS flow
          if ((triggerType === "volume" || triggerType === "voice") && !hasCalledRef.current) {
            hasCalledRef.current = true
            stopEffects()
            // Activate SOS flow - this will trigger the full SOS screen with alarm
            onConfirm()
          } else if (triggerType === "crash") {
            onConfirm()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isVisible, triggerType, onConfirm, stopEffects])

  // Handle cancel - stop effects
  const handleCancel = useCallback(() => {
    stopEffects()
    onCancel()
  }, [stopEffects, onCancel])

  // Handle manual confirm - activate SOS flow
  const handleConfirm = useCallback(() => {
    stopEffects()
    onConfirm()
  }, [stopEffects, onConfirm])

  const getTriggerIcon = useCallback(() => {
    switch (triggerType) {
      case "voice":
        return <Mic className="h-6 w-6" />
      case "volume":
        return <Ambulance className="h-6 w-6" />
      case "crash":
        return <Car className="h-6 w-6" />
      default:
        return <AlertTriangle className="h-6 w-6" />
    }
  }, [triggerType])

  const getTriggerTitle = useCallback(() => {
    switch (triggerType) {
      case "voice":
        return "Voice Command Detected"
      case "volume":
        return "Emergency SOS Triggered"
      case "crash":
        return "Possible Crash Detected"
      default:
        return "SOS Trigger Detected"
    }
  }, [triggerType])

  const getTriggerDescription = useCallback(() => {
    switch (triggerType) {
      case "voice":
        return `Activating SOS in ${countdown}s`
      case "volume":
        return `Activating SOS in ${countdown}s`
      case "crash":
        return `Auto-activating in ${countdown}s if no response`
      default:
        return "Emergency trigger activated"
    }
  }, [triggerType, countdown])

  // Get countdown duration for progress bar
  const countdownDuration = (triggerType === "volume" || triggerType === "voice") ? 5 : autoConfirmDelay

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          {/* Flashing background for volume or voice trigger */}
          {(triggerType === "volume" || triggerType === "voice") && (
            <motion.div
              animate={{
                backgroundColor: ["rgba(239,68,68,0.3)", "rgba(239,68,68,0.1)", "rgba(239,68,68,0.3)"],
              }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="absolute inset-0"
            />
          )}
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-xs bg-background rounded-2xl overflow-hidden shadow-2xl border border-border"
          >
                {/* Header */}
                <div className="bg-emergency p-4 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center"
                    >
                      {getTriggerIcon()}
                    </motion.div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCancel}
                      className="h-8 w-8 rounded-full text-white hover:bg-white/20 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <h2 className="text-lg font-bold">{getTriggerTitle()}</h2>
                  <p className="text-sm opacity-90">{getTriggerDescription()}</p>
                  
                  {/* Large countdown display for volume or voice trigger */}
                  {(triggerType === "volume" || triggerType === "voice") && (
                    <motion.div 
                      className="mt-3 flex items-center justify-center"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    >
                      <div className="relative">
                        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="rgba(255,255,255,0.3)"
                            strokeWidth="6"
                          />
                          <motion.circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="white"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray="283"
                            initial={{ strokeDashoffset: 0 }}
                            animate={{ strokeDashoffset: 283 }}
                            transition={{ duration: countdownDuration, ease: "linear" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.span
                            key={countdown}
                            initial={{ scale: 1.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-3xl font-bold"
                          >
                            {countdown}
                          </motion.span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  {(triggerType === "volume" || triggerType === "voice") ? (
                    <>
                      <div className="flex items-center justify-center gap-2 text-emergency">
                        <Ambulance className="h-4 w-4" />
                        <p className="text-sm font-medium">
                          Auto-activating SOS
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Press Cancel if this was accidental
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center">
                      Do you need emergency assistance?
                    </p>
                  )}

                  {/* Countdown bar for crash detection */}
                  {triggerType === "crash" && (
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: "100%" }}
                        animate={{ width: "0%" }}
                        transition={{ duration: autoConfirmDelay, ease: "linear" }}
                        className="h-full bg-emergency"
                      />
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="flex-1 h-12 text-base font-semibold border-2"
                    >
                      Cancel
                    </Button>
                    {(triggerType === "volume" || triggerType === "voice") ? (
                      <Button
                        onClick={handleConfirm}
                        className="flex-1 h-12 bg-emergency hover:bg-emergency/90 text-white text-base font-semibold"
                      >
                        <Ambulance className="h-5 w-5 mr-2" />
                        Activate Now
                      </Button>
                    ) : (
                      <Button
                        onClick={handleConfirm}
                        className="flex-1 h-12 bg-emergency hover:bg-emergency/90 text-white text-base font-semibold"
                      >
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        Activate SOS
                      </Button>
                    )}
                  </div>

                  <p className="text-[10px] text-muted-foreground text-center">
                    {triggerType === "crash" 
                      ? "Tap Cancel if you are okay"
                      : triggerType === "volume"
                      ? "Volume button pressed 3 times"
                      : triggerType === "voice"
                      ? "Voice command detected"
                      : "This will alert emergency services and contacts"
                    }
                  </p>

                  {/* Personal Details Collapsible - Always visible in confirmation */}
                  {(userName || bloodGroup || medicalConditions || allergies || emergencyContacts.length > 0) && (
                    <div className="mt-2">
                      <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="w-full bg-muted/50 rounded-lg p-2.5 flex items-center justify-between hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Personal Details</span>
                        </div>
                        <motion.div
                          animate={{ rotate: showDetails ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </motion.div>
                      </button>
                      
                      <AnimatePresence>
                        {showDetails && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-muted/30 rounded-b-lg p-3 space-y-2 text-left border-t border-border mt-0.5">
                              {userName && (
                                <div className="flex items-start gap-2">
                                  <User className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground" />
                                  <div>
                                    <p className="text-[10px] text-muted-foreground">Name</p>
                                    <p className="text-xs font-medium">{userName}</p>
                                  </div>
                                </div>
                              )}
                              
                              {bloodGroup && (
                                <div className="flex items-start gap-2">
                                  <Heart className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground" />
                                  <div>
                                    <p className="text-[10px] text-muted-foreground">Blood Group</p>
                                    <p className="text-xs font-medium">{bloodGroup}</p>
                                  </div>
                                </div>
                              )}
                              
                              {medicalConditions && (
                                <div className="flex items-start gap-2">
                                  <Pill className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground" />
                                  <div>
                                    <p className="text-[10px] text-muted-foreground">Medical Conditions</p>
                                    <p className="text-xs font-medium">{medicalConditions}</p>
                                  </div>
                                </div>
                              )}
                              
                              {allergies && (
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground" />
                                  <div>
                                    <p className="text-[10px] text-muted-foreground">Allergies</p>
                                    <p className="text-xs font-medium">{allergies}</p>
                                  </div>
                                </div>
                              )}
                              
                              {emergencyContacts.length > 0 && (
                                <div className="flex items-start gap-2">
                                  <Phone className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground" />
                                  <div>
                                    <p className="text-[10px] text-muted-foreground">Emergency Contact</p>
                                    <p className="text-xs font-medium">
                                      {emergencyContacts[0].name} ({emergencyContacts[0].relationship})
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">{emergencyContacts[0].phone}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
