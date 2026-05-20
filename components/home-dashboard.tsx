"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Car, 
  Ambulance, 
  Shield, 
  HeartPulse,
  MapPin, 
  AlertTriangle,
  Loader2,
  RefreshCw,
  Mic,
  Footprints,
  PhoneCall
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface HomeDashboardProps {
  onSOSPress: () => void
  onServiceSelect: (service: string) => void
  isOnline: boolean
  location: { lat: number; lng: number } | null
  locationLoading?: boolean
  locationError?: string | null
  permissionStatus?: "prompt" | "granted" | "denied" | "unsupported"
  requestLocation?: () => void
  address?: string
  accuracy?: number
  isVoiceListening?: boolean
  spokenText?: string
  voiceEnabled?: boolean
  micPermission?: "prompt" | "granted" | "denied"
  onRequestMicPermission?: () => void
  startVoiceListening?: () => void
  audioLevel?: number
  userGender?: string
  activeWarning?: {
    inDangerZone: boolean
    riskLevel: "high" | "medium" | "low"
    confidence: number
    zoneName: string
  } | null
}

const services = [
  {
    id: "vehicle",
    icon: Car,
    label: "Vehicle",
    description: "Towing",
    color: "bg-blue-500/10 text-blue-600",
    iconBg: "bg-blue-500",
  },
  {
    id: "ambulance",
    icon: Ambulance,
    label: "Ambulance",
    description: "Medical",
    color: "bg-emergency/10 text-emergency",
    iconBg: "bg-emergency",
  },
  {
    id: "firstaid",
    icon: HeartPulse,
    label: "First Aid",
    description: "AI Guide",
    color: "bg-emerald-500/10 text-emerald-600",
    iconBg: "bg-emerald-500",
  },
  {
    id: "police",
    icon: Shield,
    label: "Police",
    description: "Safety",
    color: "bg-indigo-500/10 text-indigo-600",
    iconBg: "bg-indigo-500",
  },
]

export function HomeDashboard({ 
  onSOSPress, 
  onServiceSelect, 
  isOnline, 
  location,
  locationLoading,
  locationError,
  permissionStatus,
  requestLocation,
  address,
  accuracy,
  isVoiceListening,
  spokenText = "",
  voiceEnabled,
  micPermission,
  onRequestMicPermission,
  startVoiceListening = () => {},
  audioLevel = 0,
  userGender,
  activeWarning = null
}: HomeDashboardProps) {
  const [sosPressed, setSosPressed] = useState(false)
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [pressProgress, setPressProgress] = useState(0)


  const callPhone = (phone: string) => {
    window.location.href = `tel:${phone}`
  }

  const handleSOSStart = () => {
    setSosPressed(true)
    const startTime = Date.now()
    
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min((elapsed / 1000) * 100, 100)
      setPressProgress(progress)
      
      if (progress >= 100) {
        clearInterval(timer)
        onSOSPress()
        setSosPressed(false)
        setPressProgress(0)
      }
    }, 50)
    
    setPressTimer(timer)
  }

  const handleSOSEnd = () => {
    if (pressTimer) {
      clearInterval(pressTimer)
      setPressTimer(null)
    }
    setSosPressed(false)
    setPressProgress(0)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] px-4 py-3 overflow-hidden relative">
      {/* Floating Danger Alert Banner */}
      <AnimatePresence>
        {activeWarning && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="absolute top-4 left-4 right-4 z-50 pointer-events-none"
          >
            <div className="bg-destructive/95 backdrop-blur-lg border border-warning/50 text-white rounded-xl p-4 shadow-[0_0_25px_rgba(239,68,68,0.4)] flex items-start gap-3 pointer-events-auto relative overflow-hidden animate-pulse">
              {/* Warning Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-red-500/20 mix-blend-overlay animate-[spin_4s_linear_infinite]" />
              
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-yellow-300 animate-bounce">
                <AlertTriangle className="h-5 w-5 fill-current" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white tracking-wide uppercase">
                  ⚠️ Accident-Prone Area Ahead
                </h4>
                <p className="text-xs text-white/90 font-medium mt-0.5">
                  Please stay alert and drive carefully.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[9px] bg-yellow-500/30 border border-yellow-400/40 text-yellow-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    {activeWarning.zoneName}
                  </span>
                  <span className="text-[9px] bg-red-500/30 border border-red-400/40 text-red-200 px-2 py-0.5 rounded-full font-bold">
                    Risk Score: {Math.round(activeWarning.confidence * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-foreground">RoadSOS</h1>
          <p className="text-xs text-muted-foreground">Emergency Response</p>
        </div>
      </div>

      {/* Location Status */}
      <Card className={cn(
        "p-3 mb-3 bg-card/85 backdrop-blur-md shrink-0 transition-all duration-300",
        activeWarning 
          ? "border-destructive shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse" 
          : "border-border/50"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-9 w-9 rounded-full flex items-center justify-center",
            locationLoading ? "bg-muted" : location ? "bg-primary/10" : "bg-warning/10"
          )}>
            {locationLoading ? (
              <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
            ) : (
              <MapPin className={cn("h-4 w-4", location ? "text-primary" : "text-warning")} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Current Location</p>
            {locationLoading ? (
              <p className="text-xs font-medium text-foreground">Detecting your location...</p>
            ) : locationError ? (
              <p className="text-xs font-medium text-destructive truncate">{locationError}</p>
            ) : location ? (
              <div>
                <p className="text-xs font-medium text-foreground truncate">
                  {address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
                </p>
                {accuracy && (
                  <p className="text-[10px] text-muted-foreground">
                    Accuracy: {accuracy < 100 ? `${Math.round(accuracy)}m` : `${(accuracy/1000).toFixed(1)}km`}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs font-medium text-foreground">Location unavailable</p>
            )}
          </div>
          {permissionStatus === "denied" && requestLocation && (
            <Button
              variant="ghost"
              size="icon"
              onClick={requestLocation}
              className="h-8 w-8 shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          <div className={cn(
            "h-2 w-2 rounded-full shrink-0",
            locationLoading ? "bg-warning animate-pulse" : 
            location ? "bg-success animate-pulse" : "bg-destructive"
          )} />
        </div>
      </Card>



      {/* SOS Button */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <p className="text-xs text-muted-foreground mb-3">Hold for emergency SOS</p>
        
        <div className="relative">
          <AnimatePresence>
            {sosPressed && (
              <>
                <motion.div
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-emergency"
                />
                <motion.div
                  initial={{ scale: 1, opacity: 0.3 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  className="absolute inset-0 rounded-full bg-emergency"
                />
              </>
            )}
          </AnimatePresence>
          
          <motion.button
            onMouseDown={handleSOSStart}
            onMouseUp={handleSOSEnd}
            onMouseLeave={handleSOSEnd}
            onTouchStart={handleSOSStart}
            onTouchEnd={handleSOSEnd}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "relative h-32 w-32 rounded-full flex flex-col items-center justify-center",
              "bg-gradient-to-br from-emergency to-red-700",
              "text-emergency-foreground shadow-2xl",
              "transition-all duration-200",
              sosPressed && "shadow-emergency/50"
            )}
          >
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 128 128">
              <circle
                cx="64"
                cy="64"
                r="60"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="4"
              />
              <circle
                cx="64"
                cy="64"
                r="60"
                fill="none"
                stroke="white"
                strokeWidth="4"
                strokeDasharray="377"
                strokeDashoffset={377 - (377 * pressProgress) / 100}
                strokeLinecap="round"
                className="transition-all duration-100"
              />
            </svg>
            
            <AlertTriangle className="h-10 w-10 mb-1" />
            <span className="text-xl font-bold tracking-wider">SOS</span>
            {sosPressed && (
              <span className="text-xs mt-0.5 opacity-80">
                {Math.ceil((100 - pressProgress) / 100)}s
              </span>
            )}
          </motion.button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Hold 1 second to trigger alert
        </p>
      </div>

      {/* Safety Tools Grid */}
      <div className={cn("grid gap-3 mt-4 shrink-0", userGender === "female" ? "grid-cols-2" : "grid-cols-1")}>
        {userGender === "female" && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onServiceSelect("safewalk")}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl",
              "bg-card/85 backdrop-blur-md border border-primary/30",
              "shadow-sm active:shadow-none transition-all duration-200"
            )}
          >
            <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/20 flex items-center justify-center">
              <Footprints className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-semibold text-foreground leading-tight">SafeWalk</span>
              <span className="text-[10px] text-muted-foreground">Guardian Mode</span>
            </div>
          </motion.button>
        )}
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onServiceSelect("fakecall")}
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl",
            "bg-card/85 backdrop-blur-md border border-primary/30",
            "shadow-sm active:shadow-none transition-all duration-200"
          )}
        >
          <div className="h-10 w-10 shrink-0 rounded-xl bg-secondary flex items-center justify-center">
            <PhoneCall className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col items-start text-left">
            <span className="text-sm font-semibold text-foreground leading-tight">Fake Call</span>
            <span className="text-[10px] text-muted-foreground">Escape tool</span>
          </div>
        </motion.button>
      </div>

      {/* Quick Services Grid */}
      <div className="grid grid-cols-4 gap-2 mt-3 shrink-0">
        {services.map((service) => {
          const Icon = service.icon
          return (
            <motion.button
              key={service.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onServiceSelect(service.id)}
              className={cn(
                "flex flex-col items-center p-3 rounded-xl",
                "bg-card/85 backdrop-blur-md border border-border/50",
                "shadow-sm active:shadow-none transition-all duration-200"
              )}
            >
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center mb-1.5",
                service.iconBg
              )}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-medium text-foreground">{service.label}</span>
              <span className="text-[10px] text-muted-foreground">{service.description}</span>
            </motion.button>
          )
        })}
      </div>

      {/* Voice Listening Card */}
      {voiceEnabled && (
        <Card 
          className={cn(
            "p-3.5 mt-3 shrink-0 transition-all duration-300 relative overflow-hidden",
            micPermission === "denied" 
              ? "bg-destructive/5 border-destructive/20 shadow-destructive/5" 
              : isVoiceListening 
                ? "bg-primary/5 border-primary/40 shadow-md shadow-primary/5" 
                : "bg-card/85 backdrop-blur-md border-border/50"
          )}
          onClick={micPermission !== "granted" ? onRequestMicPermission : undefined}
        >
          {/* Decorative subtle background glow when active */}
          {isVoiceListening && (
            <div className="absolute -right-10 -bottom-10 w-24 h-24 rounded-full bg-primary/10 blur-xl pointer-events-none" />
          )}

          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="relative flex h-2 w-2">
                  <span className={cn(
                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                    micPermission === "denied" 
                      ? "bg-destructive" 
                      : isVoiceListening 
                        ? "bg-primary" 
                        : "bg-muted-foreground/30"
                  )} />
                  <span className={cn(
                    "relative inline-flex rounded-full h-2 w-2",
                    micPermission === "denied" 
                      ? "bg-destructive" 
                      : isVoiceListening 
                        ? "bg-primary" 
                        : "bg-muted-foreground"
                  )} />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Voice Command System
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {micPermission === "denied"
                  ? "Microphone access is required to listen for emergency calls."
                  : micPermission === "prompt"
                    ? "Activate hands-free safety command detection."
                    : isVoiceListening
                      ? "Continuously monitoring for critical emergency phrases."
                      : "Voice trigger is currently in standby mode."}
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (micPermission !== "granted") {
                  onRequestMicPermission?.()
                } else {
                  startVoiceListening()
                }
              }}
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center border transition-all duration-300",
                micPermission === "denied" 
                  ? "bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/25" 
                  : isVoiceListening 
                    ? "bg-primary/15 border-primary/30 text-primary animate-pulse hover:bg-primary/25" 
                    : "bg-secondary border-border text-muted-foreground hover:bg-secondary/80"
              )}
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>

          {/* Live speech transcription in the gap area - ALWAYS VISIBLE */}
          <div className="mx-0.5 mb-2.5 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-between text-xs transition-all duration-300">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {isVoiceListening && micPermission === "granted" ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-muted-foreground/45"></span>
                )}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Detected Speech:</span>
            </div>
            <span className={cn(
              "text-[11px] max-w-[200px] truncate transition-all duration-300",
              !voiceEnabled
                ? "text-muted-foreground/40 italic"
                : micPermission !== "granted"
                  ? "text-destructive/60 font-semibold"
                  : isVoiceListening
                    ? spokenText 
                      ? "text-primary font-semibold animate-pulse" 
                      : "text-muted-foreground/55 italic"
                    : "text-muted-foreground/45 italic"
            )}>
              {!voiceEnabled
                ? "Disabled in Settings"
                : micPermission !== "granted"
                  ? "Mic Access Required"
                  : isVoiceListening
                    ? spokenText 
                      ? `"${spokenText}"` 
                      : 'Listening... (say "Help me")'
                    : "Connecting..."}
            </span>
          </div>

          {/* Real-time Waveform Visualizer - ALWAYS VISIBLE */}
          <div className="bg-secondary/40 backdrop-blur-sm rounded-lg p-2.5 mb-2.5 flex items-center justify-between min-h-[3.5rem]">
            {micPermission === "denied" ? (
              <Button 
                variant="destructive" 
                size="sm" 
                className="w-full text-[10px] font-semibold h-7"
                onClick={onRequestMicPermission}
              >
                Grant Microphone Permission
              </Button>
            ) : micPermission === "prompt" ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-primary/30 text-primary hover:bg-primary/5 text-[10px] font-semibold h-7"
                onClick={onRequestMicPermission}
              >
                Enable Listening Mode
              </Button>
            ) : voiceEnabled ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col text-left">
                  <span className="text-[9px] uppercase tracking-wider text-primary font-bold">Status:</span>
                  <span className="text-[11px] font-semibold text-primary animate-pulse">
                    Monitoring Active...
                  </span>
                </div>
                
                {/* Waveform graphic */}
                <div className="flex items-center gap-[3px] h-8 px-2">
                  {[0.3, 0.6, 0.9, 0.7, 0.4, 0.8, 0.5, 0.3].map((factor, idx) => {
                    const height = isVoiceListening ? Math.max(4, Math.round(audioLevel * 28 * factor)) : 4;
                    return (
                      <motion.div
                        key={idx}
                        animate={{ height }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="w-[3px] rounded-full bg-gradient-to-t from-primary to-rose-500"
                        style={{ height: 4 }}
                      />
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-muted-foreground italic w-full text-center py-1">
                Listening is paused. Settings screen voice command toggled off?
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Feature indicators */}
      <div className="flex items-center justify-center gap-3 mt-2 text-[10px] text-muted-foreground shrink-0">
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-success" />
          Motion
        </div>
        <div className="flex items-center gap-1">
          <motion.div 
            animate={isVoiceListening ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              isVoiceListening ? "bg-primary" : "bg-muted-foreground"
            )}
          />
          Voice
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-warning" />
          Crash
        </div>
      </div>
    </div>
  )
}
