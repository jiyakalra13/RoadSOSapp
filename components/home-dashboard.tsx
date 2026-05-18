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
  Building2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAllNearbyServices, type NearbyPlace } from "@/hooks/use-nearby-places"

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
  accuracy
}: HomeDashboardProps) {
  const [sosPressed, setSosPressed] = useState(false)
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [pressProgress, setPressProgress] = useState(0)

  // Fetch nearby services based on user's real location
  const { hospitals, police, mechanics, loading: servicesLoading } = useAllNearbyServices(
    location?.lat ?? null,
    location?.lng ?? null
  )

  // Get the nearest service of each type
  const nearestHospital = hospitals[0]
  const nearestPolice = police[0]
  const nearestMechanic = mechanics[0]

  // Helper functions
  const formatDistance = (km: number): string => {
    if (km < 1) return `${Math.round(km * 1000)} m`
    return `${km.toFixed(1)} km`
  }

  const openGoogleMaps = (place: NearbyPlace) => {
    let url: string
    if (location) {
      url = `https://www.google.com/maps/dir/?api=1&origin=${location.lat},${location.lng}&destination=${place.lat},${place.lon}&travelmode=driving`
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}&travelmode=driving`
    }
    window.open(url, "_blank")
  }

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
    <div className="flex flex-col h-[calc(100vh-7.5rem)] px-4 py-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-foreground">RoadSOS</h1>
          <p className="text-xs text-muted-foreground">Emergency Response</p>
        </div>
      </div>

      {/* Location Status */}
      <Card className="p-3 mb-3 bg-card/50 backdrop-blur border-border/50 shrink-0">
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

      {/* Nearby Services Summary */}
      {location && (
        <div className="mb-3 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-foreground">Nearby Services</h2>
            {servicesLoading && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {/* Nearest Hospital */}
            <Card 
              className={cn(
                "p-2 border-border/50 cursor-pointer hover:bg-accent/50 transition-colors",
                !nearestHospital && "opacity-50"
              )}
              onClick={() => nearestHospital && onServiceSelect("ambulance")}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div className="h-5 w-5 rounded bg-emergency/10 flex items-center justify-center">
                  <Building2 className="h-3 w-3 text-emergency" />
                </div>
                <span className="text-[10px] font-medium text-foreground truncate">Hospital</span>
              </div>
              {servicesLoading ? (
                <p className="text-[10px] text-muted-foreground">Searching...</p>
              ) : nearestHospital ? (
                <div>
                  <p className="text-[10px] text-muted-foreground truncate">{nearestHospital.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-[10px] font-medium text-primary">{formatDistance(nearestHospital.distance)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground">None found</p>
              )}
            </Card>

            {/* Nearest Police */}
            <Card 
              className={cn(
                "p-2 border-border/50 cursor-pointer hover:bg-accent/50 transition-colors",
                !nearestPolice && "opacity-50"
              )}
              onClick={() => nearestPolice && onServiceSelect("police")}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div className="h-5 w-5 rounded bg-indigo-500/10 flex items-center justify-center">
                  <Shield className="h-3 w-3 text-indigo-500" />
                </div>
                <span className="text-[10px] font-medium text-foreground truncate">Police</span>
              </div>
              {servicesLoading ? (
                <p className="text-[10px] text-muted-foreground">Searching...</p>
              ) : nearestPolice ? (
                <div>
                  <p className="text-[10px] text-muted-foreground truncate">{nearestPolice.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-[10px] font-medium text-primary">{formatDistance(nearestPolice.distance)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground">None found</p>
              )}
            </Card>

            {/* Nearest Mechanic */}
            <Card 
              className={cn(
                "p-2 border-border/50 cursor-pointer hover:bg-accent/50 transition-colors",
                !nearestMechanic && "opacity-50"
              )}
              onClick={() => nearestMechanic && onServiceSelect("vehicle")}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div className="h-5 w-5 rounded bg-blue-500/10 flex items-center justify-center">
                  <Car className="h-3 w-3 text-blue-500" />
                </div>
                <span className="text-[10px] font-medium text-foreground truncate">Mechanic</span>
              </div>
              {servicesLoading ? (
                <p className="text-[10px] text-muted-foreground">Searching...</p>
              ) : nearestMechanic ? (
                <div>
                  <p className="text-[10px] text-muted-foreground truncate">{nearestMechanic.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="text-[10px] font-medium text-primary">{formatDistance(nearestMechanic.distance)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground">None found</p>
              )}
            </Card>
          </div>
        </div>
      )}

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

      {/* Quick Services Grid */}
      <div className="grid grid-cols-4 gap-2 mt-4 shrink-0">
        {services.map((service) => {
          const Icon = service.icon
          return (
            <motion.button
              key={service.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onServiceSelect(service.id)}
              className={cn(
                "flex flex-col items-center p-3 rounded-xl",
                "bg-card border border-border/50",
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

      {/* Feature indicators */}
      <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-muted-foreground shrink-0">
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-success" />
          Motion
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
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
