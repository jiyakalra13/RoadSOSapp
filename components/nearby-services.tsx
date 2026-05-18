"use client"

import { useState } from "react"
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
  Loader2,
  Map,
  List
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useNearbyPlaces, type NearbyPlace } from "@/hooks/use-nearby-places"
import { InteractiveMap } from "@/components/interactive-map"

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
  const [viewMode, setViewMode] = useState<"map" | "list">("list")
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  
  // Fetch real nearby places using user's GPS location
  const { places, loading, error } = useNearbyPlaces(
    location?.lat ?? null,
    location?.lng ?? null,
    config.placeType,
    15 // 15km radius
  )
  
  const handlePlaceSelect = (place: NearbyPlace) => {
    setSelectedPlaceId(place.id)
    // Scroll to the place in list view if in map view
    if (viewMode === "map") {
      setViewMode("list")
    }
  }
  
  const selectedPlace = places.find(p => p.id === selectedPlaceId)

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] bg-background overflow-hidden">
      {/* Header */}
      <div className="bg-background border-b border-border px-4 py-2 shrink-0">
        <div className="flex items-center justify-between">
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
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="h-6 w-6"
            >
              <List className="h-3 w-3" />
            </Button>
            <Button
              variant={viewMode === "map" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("map")}
              className="h-6 w-6"
            >
              <Map className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Map View */}
      {viewMode === "map" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Interactive Map */}
          <div className="flex-1 min-h-0">
            <InteractiveMap
              userLocation={location}
              places={places}
              serviceType={config.placeType}
              selectedPlaceId={selectedPlaceId}
              onPlaceSelect={handlePlaceSelect}
              isLoading={loading}
              className="h-full w-full"
            />
          </div>
          
          {/* Selected Place Card */}
          {selectedPlace && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="shrink-0 p-3 bg-background border-t border-border"
            >
              <Card className="p-3 border-border/50">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                    config.iconBg + "/10"
                  )}>
                    {serviceType === "vehicle" ? (
                      <Wrench className="h-5 w-5 text-blue-500" />
                    ) : (
                      <Building2 className={cn("h-5 w-5", 
                        serviceType === "ambulance" ? "text-emergency" : "text-indigo-500"
                      )} />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {selectedPlace.name}
                    </h3>
                    
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" />{formatDistance(selectedPlace.distance)}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />{formatEta(selectedPlace.distance)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => callPhone(selectedPlace.phone || config.defaultPhone)}
                        className={cn(
                          "flex-1 h-8",
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
                        onClick={() => openGoogleMaps(selectedPlace.lat, selectedPlace.lon, location)}
                        className="flex-1 h-8"
                      >
                        <Navigation className="h-3 w-3 mr-1" />
                        Navigate
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
          
          {/* Quick list preview at bottom */}
          {!selectedPlace && places.length > 0 && !loading && (
            <div className="shrink-0 p-2 bg-background border-t border-border">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {places.slice(0, 5).map((place) => (
                  <button
                    key={place.id}
                    onClick={() => setSelectedPlaceId(place.id)}
                    className={cn(
                      "flex-shrink-0 px-3 py-2 rounded-lg bg-muted/50 border border-border/50",
                      "hover:bg-accent transition-colors text-left min-w-[140px]"
                    )}
                  >
                    <p className="text-xs font-medium truncate">{place.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatDistance(place.distance)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
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
              <Card 
                className={cn(
                  "p-2.5 border-border/50 transition-colors",
                  selectedPlaceId === place.id && "border-primary bg-primary/5"
                )}
                onClick={() => setSelectedPlaceId(place.id)}
              >
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
                    
                    {place.address && (
                      <p className="text-[10px] text-muted-foreground truncate">{place.address}</p>
                    )}
                    
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
                        onClick={(e) => {
                          e.stopPropagation()
                          callPhone(place.phone || config.defaultPhone)
                        }}
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
                        onClick={(e) => {
                          e.stopPropagation()
                          openGoogleMaps(place.lat, place.lon, location)
                        }}
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
      )}
    </div>
  )
}
