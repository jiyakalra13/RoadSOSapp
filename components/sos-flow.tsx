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
  AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useEmergencySMS, saveLastKnownLocation, getLastKnownLocation } from "@/hooks/use-emergency-sms"
import { useSOSEffects } from "@/hooks/use-sos-effects"

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
  userName
}: SOSFlowProps) {
  const [step, setStep] = useState<SOSStep>("countdown")
  const [countdown, setCountdown] = useState(5)
  const [stepStatus, setStepStatus] = useState<StepStatus>({
    detecting: "pending",
    sharing: "pending",
    alerting: "pending",
  })
  const [smsSent, setSmsSent] = useState(false)
  const [lastSentLocation, setLastSentLocation] = useState<{ lat: number; lng: number } | null>(null)
  
  // SOS sound and vibration effects
  const { startEffects, stopEffects, playBeep } = useSOSEffects({
    beepFrequency: 880,
    beepDuration: 200,
    beepInterval: 600,
  })
  
  const { 
    smsStatuses, 
    isSending: isSendingSms, 
    sendToAllContacts, 
    getShareableMessage,
    reset: resetSms 
  } = useEmergencySMS()
  
  const hasSentInitialSmsRef = useRef(false)

  // Start/stop effects based on SOS state
  useEffect(() => {
    if (isActive && (step === "countdown" || step === "sending" || step === "active")) {
      startEffects()
    } else {
      stopEffects()
    }
    
    return () => {
      stopEffects()
    }
  }, [isActive, step, startEffects, stopEffects])

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
      setCountdown(5)
      setStepStatus({
        detecting: "pending",
        sharing: "pending",
        alerting: "pending",
      })
      setSmsSent(false)
      setLastSentLocation(null)
      hasSentInitialSmsRef.current = false
      resetSmsRef.current()
      stopEffects() // Stop sounds and vibration
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
      setStepStatus((s) => ({ ...s, detecting: "loading" }))
      await new Promise((r) => setTimeout(r, 800))
      setStepStatus((s) => ({ ...s, detecting: "complete", sharing: "loading" }))
      
      // Send SMS to emergency contacts
      if (emergencyContacts.length > 0 && !hasSentInitialSmsRef.current) {
        hasSentInitialSmsRef.current = true
        
        // Determine location to send
        let locationToSend = location ? { lat: location.lat, lng: location.lng, address } : null
        
        // In offline mode, use last known location
        if (!isOnline || !locationToSend) {
          const lastKnown = getLastKnownLocation()
          if (lastKnown) {
            locationToSend = lastKnown
          }
        }
        
        // Send SMS
        await sendToAllContactsRef.current(
          emergencyContacts,
          locationToSend,
          isOnline,
          userName
        )
        setSmsSent(true)
        if (locationToSend) {
          setLastSentLocation({ lat: locationToSend.lat, lng: locationToSend.lng })
        }
      }
      
      await new Promise((r) => setTimeout(r, 1000))
      setStepStatus((s) => ({ ...s, sharing: "complete", alerting: "loading" }))
      await new Promise((r) => setTimeout(r, 800))
      setStepStatus((s) => ({ ...s, alerting: "complete" }))
      await new Promise((r) => setTimeout(r, 400))
      setStep("active")
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
          <div className="absolute inset-0 bg-emergency/95" />
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
                Sending Alert...
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
              
              <h2 className="text-xl font-bold mb-4">Sending Alert</h2>
              
              <div className="w-full space-y-2">
                <StatusItem
                  icon={MapPin}
                  label="Detecting location"
                  status={stepStatus.detecting}
                />
                <StatusItem
                  icon={Share2}
                  label="Sharing location"
                  status={stepStatus.sharing}
                />
                <StatusItem
                  icon={Bell}
                  label="Alerting services"
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
              className="flex flex-col items-center text-center w-full overflow-y-auto max-h-full py-4"
            >
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
                  className="bg-white/10 px-3 py-1 rounded-full"
                >
                  <span className="text-[10px] font-medium">BROADCASTING</span>
                </motion.div>
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-[10px]",
                  isOnline ? "bg-success/20" : "bg-warning/20"
                )}>
                  {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  {isOnline ? "Live" : "Offline"}
                </div>
              </div>
              
              <h2 className="text-xl font-bold mb-1">Help is coming</h2>
              
              {/* SMS Status */}
              {smsSent && emergencyContacts.length > 0 && (
                <div className="flex items-center gap-1.5 mb-2">
                  <MessageSquare className="h-3 w-3" />
                  <span className="text-[10px] opacity-80">
                    {isOnline ? "Live location sent to contacts" : "Last known location sent to contacts"}
                  </span>
                </div>
              )}
              
              {(location || address) && (
                <div className="bg-white/10 rounded-xl p-2.5 w-full max-w-xs mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <div className="text-left min-w-0 flex-1">
                      <p className="text-[10px] opacity-70">
                        {isOnline ? "Live Location" : "Last Known Location"}
                      </p>
                      <p className="text-xs font-medium truncate">
                        {address || `${location?.lat.toFixed(4)}, ${location?.lng.toFixed(4)}`}
                      </p>
                    </div>
                    {isOnline && (
                      <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    )}
                  </div>
                </div>
              )}

              {/* Send Location Update Button */}
              {emergencyContacts.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sendToAllContacts(
                    emergencyContacts,
                    location ? { lat: location.lat, lng: location.lng, address } : null,
                    isOnline,
                    userName
                  )}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white mb-3 text-xs"
                >
                  <Send className="h-3 w-3 mr-1.5" />
                  Send Location Update
                </Button>
              )}
              
              {/* Emergency Services - Country Specific */}
              <div className="w-full max-w-xs mb-3">
                <p className="text-[10px] opacity-70 mb-2">Emergency Services</p>
                <div className="grid grid-cols-3 gap-2">
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

              {/* Emergency Contacts */}
              {emergencyContacts.length > 0 && (
                <div className="w-full max-w-xs mb-3">
                  <p className="text-[10px] opacity-70 mb-2">Your Emergency Contacts</p>
                  <div className="grid grid-cols-3 gap-2">
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
              
              <Button
                variant="outline"
                size="lg"
                onClick={onCancel}
                className="bg-success border-success text-success-foreground hover:bg-success/90 hover:text-success-foreground mt-2"
              >
                I&apos;m Safe Now
              </Button>
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
      className="flex flex-col items-center gap-1 p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
    >
      <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-[10px] font-medium truncate max-w-full">{label}</span>
      {sublabel && <span className="text-[9px] opacity-70">{sublabel}</span>}
    </button>
  )
}
