"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  MapPin, 
  Share2, 
  Bell, 
  Phone,
  Ambulance,
  Shield,
  User,
  CheckCircle2,
  Loader2,
  Flame,
  MessageSquare,
  Wifi,
  WifiOff,
  Send,
  AlertTriangle,
  ChevronDown,
  Heart,
  Pill,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useEmergencySMS, saveLastKnownLocation, getLastKnownLocation } from "@/hooks/use-emergency-sms"
import { useSOSEffects } from "@/hooks/use-sos-effects"

const speak = (text: string) => {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      window.speechSynthesis.speak(utterance)
    } catch (e) {
      console.warn("TTS Speech Synthesis failed:", e)
    }
  }
}

interface EmergencyNumbers {
  police: string
  ambulance: string
  fire: string
  general?: string
}

interface SOSFlowProps {
  isActive: boolean
  onCancel: () => void
  onComplete: () => void
  location: { lat: number; lng: number } | null
  address?: string
  emergencyNumbers?: EmergencyNumbers
  emergencyContacts?: Array<{ id: string; name: string; phone: string; relationship: string }>
  isOnline?: boolean
  userName?: string
  countdownDuration?: number
  autoCalledAmbulance?: boolean
  bloodGroup?: string
  medicalConditions?: string
  allergies?: string
}

type SOSStep = "countdown" | "sending" | "active"

interface StepStatus {
  detecting: "pending" | "loading" | "complete"
  sharing: "pending" | "loading" | "complete"
  alerting: "pending" | "loading" | "complete"
}

function callPhone(number: string) {
  window.location.href = `tel:${number}`
}

export function SOSFlow({ 
  isActive, 
  onCancel, 
  onComplete, 
  location, 
  address,
  emergencyNumbers = { police: "911", ambulance: "911", fire: "911" },
  emergencyContacts = [],
  isOnline = true,
  userName,
  countdownDuration = 5,
  autoCalledAmbulance = false,
  bloodGroup,
  medicalConditions,
  allergies
}: SOSFlowProps) {
  const [step, setStep] = useState<SOSStep>("countdown")
  const [countdown, setCountdown] = useState(countdownDuration)
  const [stepStatus, setStepStatus] = useState<StepStatus>({
    detecting: "pending",
    sharing: "pending",
    alerting: "pending",
  })
  const [smsSent, setSmsSent] = useState(false)
  const [lastSentLocation, setLastSentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [detailsUnlocked, setDetailsUnlocked] = useState(false)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  
  // SOS sound and vibration effects
  const { startEffects, stopEffects, playBeep } = useSOSEffects({
    beepFrequency: 880,
    beepDuration: 200,
    beepInterval: 600,
  })
  
  const { 
    smsStatuses, 
    sendToAllContacts, 
    getShareableMessage,
    reset: resetSms,
    startLiveUpdates,
    stopLiveUpdates
  } = useEmergencySMS()
  
  const hasSentInitialSmsRef = useRef(false)

  // Start/stop effects and live updates based on SOS state
  useEffect(() => {
    if (isActive && (step === "countdown" || step === "sending" || step === "active")) {
      startEffects()
    } else {
      stopEffects()
    }
    
    if (isActive && step === "active") {
      startLiveUpdates(
        emergencyContacts, 
        () => location ? { lat: location.lat, lng: location.lng, address } : null, 
        userName, 
        { bloodGroup, conditions: medicalConditions, allergies },
        10000
      )
    } else {
      stopLiveUpdates()
    }
    
    return () => {
      stopEffects()
      stopLiveUpdates()
    }
  }, [isActive, step, startEffects, stopEffects, startLiveUpdates, stopLiveUpdates, emergencyContacts, location, address, userName])

  // Wake Lock - Keep screen on during SOS until user selects "Safe"
  useEffect(() => {
    const requestWakeLock = async () => {
      if (isActive && 'wakeLock' in navigator) {
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

    if (isActive) {
      requestWakeLock()
    } else {
      releaseWakeLock()
    }

    // Re-acquire wake lock if visibility changes
    const handleVisibilityChange = () => {
      if (isActive && document.visibilityState === 'visible') {
        requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      releaseWakeLock()
    }
  }, [isActive])

  // Cancel any speech synthesis on component unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Timer to unlock details card 5 seconds after entering active phase
  useEffect(() => {
    if (step === "active" && !detailsUnlocked) {
      const timer = setTimeout(() => {
        setDetailsUnlocked(true)
      }, 5000) // 5 seconds
      return () => clearTimeout(timer)
    }
  }, [step, detailsUnlocked])

  // Play beep on countdown change
  useEffect(() => {
    if (isActive && step === "countdown" && countdown > 0) {
      playBeep()
    }
  }, [countdown, isActive, step, playBeep])

  // Save location whenever it updates (for offline fallback)
  useEffect(() => {
    if (location && address) {
      saveLastKnownLocation({ lat: location.lat, lng: location.lng, address })
    } else if (location) {
      saveLastKnownLocation({ lat: location.lat, lng: location.lng })
    }
  }, [location, address])

  // Store refs for functions to avoid dependency issues
  const sendToAllContactsRef = useRef(sendToAllContacts)
  const resetSmsRef = useRef(resetSms)
  
  useEffect(() => {
    sendToAllContactsRef.current = sendToAllContacts
    resetSmsRef.current = resetSms
  }, [sendToAllContacts, resetSms])

  useEffect(() => {
    if (!isActive) {
      setStep("countdown")
      setCountdown(countdownDuration)
      setStepStatus({
        detecting: "pending",
        sharing: "pending",
        alerting: "pending",
      })
      setSmsSent(false)
      setLastSentLocation(null)
      setShowDetails(false)
      setDetailsUnlocked(false)
      hasSentInitialSmsRef.current = false
      resetSmsRef.current()
      stopEffects() // Stop sounds and vibration
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      return
    }

    if (step === "countdown") {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            setStep("sending")
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isActive, step])

  // Handle the sending sequence separately
  useEffect(() => {
    if (!isActive || step !== "sending") return

    const sequence = async () => {
      setStepStatus({ detecting: "complete", sharing: "complete", alerting: "complete" })
      
      // SMS will now be triggered manually by the user via a button on the active SOS screen.
      // We skip the automatic background sending.
      if (emergencyContacts.length > 0) {
        setSmsSent(false)
      }
      
      setStep("active")
      speak("Emergency mode activated. Sharing live location and alerting emergency contacts.")
      
      // Log activation status to backend
      fetch("/api/voice-sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          triggerType: "voice",
          sosStatus: "active",
          location: location ? { lat: location.lat, lng: location.lng, address } : null
        })
      }).catch(err => console.warn("Failed to log voice event activation:", err))
      
      onComplete()
    }
    
    sequence()
  }, [isActive, step, onComplete, emergencyContacts, location, address, isOnline, userName])

  if (!isActive) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] overflow-hidden"
      >
        {step === "countdown" && (
          <motion.div
            animate={{
              backgroundColor: ["rgba(255,0,0,0.95)", "rgba(255,255,255,0.95)", "rgba(255,0,0,0.95)"],
            }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0"
          />
        )}
        
        {step !== "countdown" && (
          <div className="absolute inset-0 bg-[#FF0D0D]" />
        )}

        <div className="relative h-full flex flex-col items-center justify-center px-6 text-emergency-foreground">
          {/* Countdown Phase */}
          {step === "countdown" && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center text-center"
            >
              {/* Pulsing rings synced with beep */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  animate={{ 
                    scale: [1, 1.5, 1.5],
                    opacity: [0.3, 0, 0]
                  }}
                  transition={{ 
                    duration: 0.6,
                    repeat: Infinity,
                    repeatDelay: 0
                  }}
                  className="absolute h-48 w-48 rounded-full border-4 border-white"
                />
                <motion.div
                  animate={{ 
                    scale: [1, 1.8, 1.8],
                    opacity: [0.2, 0, 0]
                  }}
                  transition={{ 
                    duration: 0.6,
                    repeat: Infinity,
                    repeatDelay: 0,
                    delay: 0.1
                  }}
                  className="absolute h-48 w-48 rounded-full border-2 border-white"
                />
              </div>
              
              <div className="relative mb-6">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                >
                  <svg className="h-36 w-36 -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="4"
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="white"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray="283"
                      initial={{ strokeDashoffset: 0 }}
                      animate={{ strokeDashoffset: 283 }}
                      transition={{ duration: 5, ease: "linear" }}
                    />
                  </svg>
                </motion.div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.span
                    key={countdown}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-6xl font-bold"
                  >
                    {countdown}
                  </motion.span>
                </div>
              </div>
              
              <motion.h2 
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="text-xl font-bold mb-1"
              >
                {countdownDuration > 5 ? "Are you safe?" : "Sending alerts..."}
              </motion.h2>
              <p className="text-sm opacity-80 mb-6">Press cancel to stop</p>
              
              <Button
                variant="outline"
                size="lg"
                onClick={onCancel}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 hover:text-white"
              >
                <X className="h-5 w-5 mr-2" />
                Cancel
              </Button>
            </motion.div>
          )}

          {/* Sending Phase */}
          {step === "sending" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center text-center w-full max-w-xs"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center mb-6"
              >
                <Loader2 className="h-8 w-8 animate-spin" />
              </motion.div>
              
              <h2 className="text-xl font-bold mb-4">Sending alerts...</h2>
              
              <div className="w-full space-y-2">
                <StatusItem
                  icon={MapPin}
                  label="Detecting location"
                  status={stepStatus.detecting}
                />
                <StatusItem
                  icon={Share2}
                  label="Sharing live location..."
                  status={stepStatus.sharing}
                />
                <StatusItem
                  icon={Bell}
                  label="Emergency contacts notified"
                  status={stepStatus.alerting}
                />
              </div>
            </motion.div>
          )}

          {/* Active Phase */}
          {step === "active" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center text-center w-full overflow-y-auto max-h-full py-4 relative z-10 animate-fade-in"
            >
              {/* Flashing Red Background for Active Mode */}
              <motion.div
                animate={{ 
                  backgroundColor: ["rgba(255,0,0,0)", "rgba(255,0,0,0.1)", "rgba(255,0,0,0)"]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="fixed inset-0 pointer-events-none -z-10"
              />
              
              {/* Animated SOS ACTIVATED Banner */}
              <motion.div
                animate={{ 
                  scale: [1, 1.02, 1],
                  opacity: [1, 0.9, 1]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="relative mb-4"
              >
                {/* Pulsing background glow */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.1, 0.3]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 bg-white rounded-full blur-xl"
                />
                
                <div className="relative flex items-center gap-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                  >
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </motion.div>
                  <div className="flex flex-col items-start">
                    <motion.span
                      animate={{ opacity: [1, 0.7, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="text-lg font-bold tracking-wider text-white"
                    >
                      SOS ACTIVATED
                    </motion.span>
                    <span className="text-[10px] text-white/80">Emergency mode active</span>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="h-3 w-3 rounded-full bg-white"
                  />
                </div>
              </motion.div>
              
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center mb-3 shrink-0"
              >
                <CheckCircle2 className="h-7 w-7" />
              </motion.div>
              
              <div className="flex items-center gap-2 mb-2">
                <motion.div 
                  animate={{ opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="bg-white/10 px-3 py-1 rounded-full border border-white/10"
                >
                  <span className="text-[10px] font-bold text-white tracking-wider">BROADCASTING</span>
                </motion.div>
                <div className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] border border-white/10",
                  isOnline ? "bg-success/20 text-white" : "bg-warning/20 text-white"
                )}>
                  {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  <span className="font-bold tracking-wide">{isOnline ? "Live" : "Offline"}</span>
                </div>
              </div>
              
              <h2 className="text-2xl font-extrabold mb-3 tracking-wide text-white">Help is coming</h2>
              
              {/* Auto-called ambulance indicator */}
              {autoCalledAmbulance && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 bg-white/20 border border-white/20 rounded-full px-3 py-1.5 mb-3"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Phone className="h-4 w-4" />
                  </motion.div>
                  <span className="text-xs font-semibold">Calling Ambulance...</span>
                </motion.div>
              )}
              
              {/* SMS Status */}
              {smsSent && emergencyContacts.length > 0 && (
                <div className="flex items-center gap-1.5 mb-3 bg-white/10 border border-white/10 rounded-full px-3 py-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-semibold opacity-90">
                    {isOnline ? "Live location sent to contacts" : "Last known location sent to contacts"}
                  </span>
                </div>
              )}
              
              {(location || address) && (
                <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-2.5 w-full max-w-xs mb-4 flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="bg-white/10 p-1.5 rounded-lg shrink-0">
                      <MapPin className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-white/60">
                        {isOnline ? "Live Location" : "Last Known Location"}
                      </p>
                      <p className="text-xs font-semibold text-white">
                        {address || `${location?.lat.toFixed(4)}, ${location?.lng.toFixed(4)}`}
                      </p>
                    </div>
                  </div>
                  {isOnline && (
                    <div className="h-2.5 w-2.5 rounded-full bg-[#00e676] shrink-0 animate-pulse" />
                  )}
                </div>
              )}

              {/* Personal Details Collapsible Card - Shows after 5 seconds */}
              {detailsUnlocked && (userName || bloodGroup || medicalConditions || allergies || emergencyContacts.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-xs mb-4"
                >
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full bg-white/10 border border-white/10 rounded-xl p-3 flex items-center justify-between hover:bg-white/15 transition-colors text-white"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="text-sm font-semibold">Personal Medical Details</span>
                    </div>
                    <motion.div
                      animate={{ rotate: showDetails ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-4 w-4" />
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
                        <div className="bg-white/5 rounded-b-xl p-3 space-y-2 text-left border-t border-white/10 mt-0.5 text-white">
                          {/* Name */}
                          {userName && (
                            <div className="flex items-start gap-2">
                              <User className="h-3 w-3 shrink-0 mt-0.5 opacity-75" />
                              <div>
                                <p className="text-[10px] opacity-75">Name</p>
                                <p className="text-xs font-semibold">{userName}</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Blood Group */}
                          {bloodGroup && (
                            <div className="flex items-start gap-2">
                              <Heart className="h-3 w-3 shrink-0 mt-0.5 opacity-75" />
                              <div>
                                <p className="text-[10px] opacity-75">Blood Group</p>
                                <p className="text-xs font-semibold text-emergency-500">{bloodGroup}</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Medical Conditions */}
                          {medicalConditions && (
                            <div className="flex items-start gap-2">
                              <Pill className="h-3 w-3 shrink-0 mt-0.5 opacity-75" />
                              <div>
                                <p className="text-[10px] opacity-75">Medical Conditions</p>
                                <p className="text-xs font-semibold">{medicalConditions}</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Allergies */}
                          {allergies && (
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-3 w-3 shrink-0 mt-0.5 opacity-75" />
                              <div>
                                <p className="text-[10px] opacity-75">Allergies</p>
                                <p className="text-xs font-semibold">{allergies}</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Primary Emergency Contact */}
                          {emergencyContacts.length > 0 && (
                            <div className="flex items-start gap-2">
                              <Phone className="h-3 w-3 shrink-0 mt-0.5 opacity-75" />
                              <div>
                                <p className="text-[10px] opacity-75">Emergency Contact</p>
                                <p className="text-xs font-semibold">
                                  {emergencyContacts[0].name} ({emergencyContacts[0].relationship})
                                </p>
                                <p className="text-[10px] opacity-90">{emergencyContacts[0].phone}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
              
              {/* Emergency Services - Country Specific */}
              <div className="w-full max-w-xs mb-4 text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/70 mb-2.5">Emergency Services</p>
                <div className="grid grid-cols-3 gap-2.5">
                  <CallButton 
                    icon={Ambulance} 
                    label={`Ambulance`}
                    sublabel={emergencyNumbers.ambulance}
                    phone={emergencyNumbers.ambulance} 
                  />
                  <CallButton 
                    icon={Shield} 
                    label={`Police`}
                    sublabel={emergencyNumbers.police}
                    phone={emergencyNumbers.police} 
                  />
                  <CallButton 
                    icon={Flame} 
                    label={`Fire`}
                    sublabel={emergencyNumbers.fire}
                    phone={emergencyNumbers.fire} 
                  />
                </div>
              </div>

              {/* Emergency Contacts List */}
              {emergencyContacts.length > 0 && (
                <div className="w-full max-w-xs mb-4 text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/70 mb-2.5">Emergency Contacts</p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {emergencyContacts.slice(0, 3).map(contact => (
                      <CallButton 
                        key={contact.id}
                        icon={User} 
                        label={contact.name.split(" ")[0]}
                        sublabel={contact.relationship}
                        phone={contact.phone} 
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons Section */}
              <div className="w-full max-w-xs mt-3 flex flex-col gap-3">
                {/* SHARE VIA SMS button if emergency contacts are saved */}
                {emergencyContacts.length > 0 && (
                  <Button
                    onClick={() => {
                      let locationToSend = location ? { lat: location.lat, lng: location.lng, address } : null
                      if (!isOnline || !locationToSend) {
                        const lastKnown = getLastKnownLocation()
                        if (lastKnown) {
                          locationToSend = lastKnown
                        }
                      }
                      sendToAllContactsRef.current(
                        emergencyContacts,
                        locationToSend,
                        isOnline,
                        userName,
                        { bloodGroup, conditions: medicalConditions, allergies }
                      )
                    }}
                    className="w-full h-12 bg-white text-[#FF0D0D] hover:bg-white/95 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 transition-all duration-300 animate-pulse"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Share via SMS
                  </Button>
                )}

                <Button
                  onClick={onCancel}
                  className="w-full h-14 bg-[#FF0D0D] border-2 border-white/20 text-white hover:bg-[#E50000] font-black text-sm uppercase tracking-widest rounded-xl transition-all duration-300 shadow-lg"
                >
                  STOP SOS
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function StatusItem({ 
  icon: Icon, 
  label, 
  status 
}: { 
  icon: React.ComponentType<{ className?: string }>
  label: string
  status: "pending" | "loading" | "complete"
}) {
  return (
    <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
      <div className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center",
        status === "complete" ? "bg-success" : "bg-white/20"
      )}>
        {status === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : status === "complete" ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Icon className="h-4 w-4 opacity-50" />
        )}
      </div>
      <span className={cn(
        "text-sm",
        status === "pending" && "opacity-50"
      )}>
        {label}
      </span>
    </div>
  )
}

function CallButton({ 
  icon: Icon, 
  label,
  sublabel,
  phone
}: { 
  icon: React.ComponentType<{ className?: string }>
  label: string
  sublabel?: string
  phone: string
}) {
  return (
    <button 
      onClick={() => callPhone(phone)}
      className="flex flex-col items-center justify-center gap-1.5 p-3 bg-white/10 border border-white/20 rounded-2xl hover:bg-white/15 transition-all duration-300 w-full"
    >
      <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-md">
        <Icon className="h-4 w-4 text-[#FF0D0D]" />
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-bold text-white tracking-wide truncate max-w-full">{label}</span>
        {sublabel && <span className="text-[9px] font-medium text-white/70 mt-0.5">{sublabel}</span>}
      </div>
    </button>
  )
}
