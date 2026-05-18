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
  Building2,
  Phone,
  Navigation,
  ExternalLink
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

  const formatDistance = (km: number): string => {
    if (km < 1) return `${Math.round(km * 1000)} m`
    return `${km.toFixed(1)} km`
  }

  const formatEta = (km: number): string => {
    const minutes = Math.round((km / 30) * 60) // Assume 30 km/h average speed
    if (minutes < 1) return "< 1 min"
    return `~${minutes} min`
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

  const callPhone = (phone: string | undefined, defaultPhone: string) => {
    window.location.href = `tel:${phone || defaultPhone}`
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
            <h2 className="text-xs font-semibold text-foreground">Nearest Services</h2>
            {servicesLoading && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="space-y-2">
            {/* Nearest Hospital */}
            <Card 
              className={cn(
                "p-2 border-border/50 transition-colors",
                !nearestHospital && "opacity-50"
              )}
            >
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emergency/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4 text-emergency" />
                </div>
                <div className="flex-1 min-w-0" onClick={() => nearestHospital && onServiceSelect("ambulance")}>
                  {servicesLoading ? (
                    <p className="text-[10px] text-muted-foreground">Searching hospitals...</p>
                  ) : nearestHospital ? (
                    <>
                      <p className="text-[11px] font-medium text-foreground truncate">{nearestHospital.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5" />
                          {formatDistance(nearestHospital.distance)}
                        </span>
                        <span className="text-primary font-medium">{formatEta(nearestHospital.distance)}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">No hospital found nearby</p>
                  )}
                </div>
                {nearestHospital && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 bg-emergency/10 hover:bg-emergency/20"
                      onClick={(e) => {
                        e.stopPropagation()
                        callPhone(nearestHospital.phone, "911")
                      }}
                    >
                      <Phone className="h-3.5 w-3.5 text-emergency" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 bg-primary/10 hover:bg-primary/20"
                      onClick={(e) => {
                        e.stopPropagation()
                        openGoogleMaps(nearestHospital)
                      }}
                    >
                      <Navigation className="h-3.5 w-3.5 text-primary" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Nearest Police */}
            <Card 
              className={cn(
                "p-2 border-border/50 transition-colors",
                !nearestPolice && "opacity-50"
              )}
            >
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Shield className="h-4 w-4 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0" onClick={() => nearestPolice && onServiceSelect("police")}>
                  {servicesLoading ? (
                    <p className="text-[10px] text-muted-foreground">Searching police stations...</p>
                  ) : nearestPolice ? (
                    <>
                      <p className="text-[11px] font-medium text-foreground truncate">{nearestPolice.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5" />
                          {formatDistance(nearestPolice.distance)}
                        </span>
                        <span className="text-primary font-medium">{formatEta(nearestPolice.distance)}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">No police station found nearby</p>
                  )}
                </div>
                {nearestPolice && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 bg-indigo-500/10 hover:bg-indigo-500/20"
                      onClick={(e) => {
                        e.stopPropagation()
                        callPhone(nearestPolice.phone, "100")
                      }}
                    >
                      <Phone className="h-3.5 w-3.5 text-indigo-500" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 bg-primary/10 hover:bg-primary/20"
                      onClick={(e) => {
                        e.stopPropagation()
                        openGoogleMaps(nearestPolice)
                      }}
                    >
                      <Navigation className="h-3.5 w-3.5 text-primary" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Nearest Mechanic */}
            <Card 
              className={cn(
                "p-2 border-border/50 transition-colors",
                !nearestMechanic && "opacity-50"
              )}
            >
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Car className="h-4 w-4 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0" onClick={() => nearestMechanic && onServiceSelect("vehicle")}>
                  {servicesLoading ? (
                    <p className="text-[10px] text-muted-foreground">Searching mechanics...</p>
                  ) : nearestMechanic ? (
                    <>
                      <p className="text-[11px] font-medium text-foreground truncate">{nearestMechanic.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5" />
                          {formatDistance(nearestMechanic.distance)}
                        </span>
                        <span className="text-primary font-medium">{formatEta(nearestMechanic.distance)}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">No mechanic found nearby</p>
                  )}
                </div>
                {nearestMechanic && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 bg-blue-500/10 hover:bg-blue-500/20"
                      onClick={(e) => {
                        e.stopPropagation()
                        callPhone(nearestMechanic.phone, "555-AUTO")
                      }}
                    >
                      <Phone className="h-3.5 w-3.5 text-blue-500" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 bg-primary/10 hover:bg-primary/20"
                      onClick={(e) => {
                        e.stopPropagation()
                        openGoogleMaps(nearestMechanic)
                      }}
                    >
                      <Navigation className="h-3.5 w-3.5 text-primary" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* SOS Button */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0">
        <p className="text-[10px] text-muted-foreground mb-2">Hold for emergency SOS</p>
        
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
              "relative h-24 w-24 rounded-full flex flex-col items-center justify-center",
              "bg-gradient-to-br from-emergency to-red-700",
              "text-emergency-foreground shadow-2xl",
              "transition-all duration-200",
              sosPressed && "shadow-emergency/50"
            )}
          >
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r="44"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="4"
              />
              <circle
                cx="48"
                cy="48"
                r="44"
                fill="none"
                stroke="white"
                strokeWidth="4"
                strokeDasharray="276"
                strokeDashoffset={276 - (276 * pressProgress) / 100}
                strokeLinecap="round"
                className="transition-all duration-100"
              />
            </svg>
            
            <AlertTriangle className="h-8 w-8 mb-0.5" />
            <span className="text-lg font-bold tracking-wider">SOS</span>
            {sosPressed && (
              <span className="text-[10px] mt-0.5 opacity-80">
                {Math.ceil((100 - pressProgress) / 100)}s
              </span>
            )}
          </motion.button>
        </div>
        
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
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
