"use client"

import { motion } from "framer-motion"
import { 
  ArrowLeft, 
  Phone, 
  Navigation, 
  MapPin, 
  Clock,
  Building2,
  Ambulance,
  Shield,
  Car,
  Wrench,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useNearbyPlaces, type NearbyPlace } from "@/hooks/use-nearby-places"

interface NearbyServicesProps {
  serviceType: "ambulance" | "police" | "vehicle"
  onBack: () => void
  location: { lat: number; lng: number } | null
}

const serviceConfig = {
  ambulance: {
    title: "Nearby Hospitals",
    icon: Ambulance,
    iconBg: "bg-emergency",
    placeType: "hospital" as const,
    defaultPhone: "911"
  },
  police: {
    title: "Police Stations",
    icon: Shield,
    iconBg: "bg-indigo-500",
    placeType: "police" as const,
    defaultPhone: "100"
  },
  vehicle: {
    title: "Vehicle Assistance",
    icon: Car,
    iconBg: "bg-blue-500",
    placeType: "mechanic" as const,
    defaultPhone: "555-AUTO"
  }
}

function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`
  }
  return `${km.toFixed(1)} km`
}

function formatEta(km: number): string {
  // Assume average speed of 30 km/h in city
  const minutes = Math.round((km / 30) * 60)
  if (minutes < 1) return "< 1 min"
  return `${minutes} min`
}

function openGoogleMaps(destLat: number, destLng: number, userLocation: { lat: number; lng: number } | null) {
  let url: string
  if (userLocation) {
    url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destLat},${destLng}&travelmode=driving`
  } else {
    url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`
  }
  window.open(url, "_blank")
}

function callPhone(phone: string) {
  window.location.href = `tel:${phone}`
}

export function NearbyServices({ serviceType, onBack, location }: NearbyServicesProps) {
  const config = serviceConfig[serviceType]
  const Icon = config.icon
  
  // Fetch real nearby places using user's GPS location
  const { places, loading, error } = useNearbyPlaces(
    location?.lat ?? null,
    location?.lng ?? null,
    config.placeType,
    15 // 15km radius
  )

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] bg-background overflow-hidden">
      {/* Header */}
      <div className="bg-background border-b border-border px-4 py-2 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8 rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", config.iconBg)}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">{config.title}</h1>
            <p className="text-[10px] text-muted-foreground">
              {loading ? "Searching..." : `${places.length} found nearby`}
            </p>
          </div>
        </div>
      </div>

      {/* Map placeholder - compact */}
      <div className="h-24 bg-muted relative overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center">
          <MapPin className="h-5 w-5 text-muted-foreground/50" />
        </div>
        {places.slice(0, 5).map((place, i) => (
          <motion.div
            key={place.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={cn("absolute h-4 w-4 rounded-full flex items-center justify-center", config.iconBg)}
            style={{
              top: `${20 + (i * 15) % 50}%`,
              left: `${15 + (i * 20) % 70}%`,
            }}
          >
            <Icon className="h-2 w-2 text-white" />
          </motion.div>
        ))}
        {location && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="h-3 w-3 bg-primary rounded-full border-2 border-white shadow-lg" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Finding nearby services...</p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        )}

        {/* No location state */}
        {!location && !loading && (
          <div className="text-center py-8">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Enable location to find nearby services</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && location && places.length === 0 && (
          <div className="text-center py-8">
            <Building2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No services found nearby</p>
          </div>
        )}

        {/* Services List */}
        {!loading && places.map((place, index) => (
          <motion.div
            key={place.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Card className="p-2.5 border-border/50">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                  config.iconBg + "/10"
                )}>
                  {serviceType === "vehicle" ? (
                    <Wrench className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Building2 className={cn("h-4 w-4", 
                      serviceType === "ambulance" ? "text-emergency" : "text-indigo-500"
                    )} />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-semibold text-foreground truncate">
                    {place.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <MapPin className="h-2.5 w-2.5" />{formatDistance(place.distance)}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />{formatEta(place.distance)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Button
                      size="sm"
                      onClick={() => callPhone(place.phone || config.defaultPhone)}
                      className={cn(
                        "flex-1 h-7 text-[10px]",
                        serviceType === "ambulance" ? "bg-emergency hover:bg-emergency/90" :
                        serviceType === "police" ? "bg-indigo-500 hover:bg-indigo-600" :
                        "bg-blue-500 hover:bg-blue-600"
                      )}
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openGoogleMaps(place.lat, place.lon, location)}
                      className="flex-1 h-7 text-[10px]"
                    >
                      <Navigation className="h-3 w-3 mr-1" />
                      Navigate
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
