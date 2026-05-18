"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, Navigation, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { NearbyPlace } from "@/hooks/use-nearby-places"

interface InteractiveMapProps {
  userLocation: { lat: number; lng: number } | null
  places: NearbyPlace[]
  serviceType: "hospital" | "police" | "mechanic"
  selectedPlaceId?: string | null
  onPlaceSelect?: (place: NearbyPlace) => void
  className?: string
  isLoading?: boolean
}

// Dynamic import to avoid SSR issues
let L: typeof import("leaflet") | null = null
let MapContainer: typeof import("react-leaflet").MapContainer | null = null
let TileLayer: typeof import("react-leaflet").TileLayer | null = null
let Marker: typeof import("react-leaflet").Marker | null = null
let Popup: typeof import("react-leaflet").Popup | null = null
let useMap: typeof import("react-leaflet").useMap | null = null

const serviceColors = {
  hospital: "#ef4444",
  police: "#6366f1", 
  mechanic: "#3b82f6"
}

const serviceLabels = {
  hospital: "Hospital",
  police: "Police Station",
  mechanic: "Mechanic"
}

// Component to handle map center updates
function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap?.()
  
  useEffect(() => {
    if (map && center) {
      map.setView(center, map.getZoom())
    }
  }, [map, center])
  
  return null
}

// Component to fit bounds to all markers
function FitBounds({ userLocation, places }: { userLocation: { lat: number; lng: number } | null, places: NearbyPlace[] }) {
  const map = useMap?.()
  
  useEffect(() => {
    if (!map || !L) return
    
    const bounds: [number, number][] = []
    
    if (userLocation) {
      bounds.push([userLocation.lat, userLocation.lng])
    }
    
    places.forEach(place => {
      bounds.push([place.lat, place.lon])
    })
    
    if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50] })
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 14)
    }
  }, [map, userLocation, places])
  
  return null
}

export function InteractiveMap({
  userLocation,
  places,
  serviceType,
  selectedPlaceId,
  onPlaceSelect,
  className,
  isLoading
}: InteractiveMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)

  // Load Leaflet on client side only
  useEffect(() => {
    setIsClient(true)
    
    const loadLeaflet = async () => {
      if (typeof window !== "undefined") {
        const leaflet = await import("leaflet")
        const reactLeaflet = await import("react-leaflet")
        
        L = leaflet.default || leaflet
        MapContainer = reactLeaflet.MapContainer
        TileLayer = reactLeaflet.TileLayer
        Marker = reactLeaflet.Marker
        Popup = reactLeaflet.Popup
        useMap = reactLeaflet.useMap
        
        // Fix default marker icons
        delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        })
        
        setLeafletLoaded(true)
      }
    }
    
    loadLeaflet()
  }, [])

  // Create custom icons
  const createIcon = (color: string, isUser: boolean = false) => {
    if (!L) return undefined
    
    const svgIcon = isUser
      ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32">
          <circle cx="12" cy="12" r="8" fill="${color}" stroke="white" stroke-width="3"/>
          <circle cx="12" cy="12" r="3" fill="white"/>
        </svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="40">
          <path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8z" fill="${color}" stroke="white" stroke-width="1"/>
          <circle cx="12" cy="8" r="3" fill="white"/>
        </svg>`
    
    return L.divIcon({
      html: svgIcon,
      className: "custom-marker",
      iconSize: [32, isUser ? 32 : 40],
      iconAnchor: [16, isUser ? 16 : 40],
      popupAnchor: [0, isUser ? -16 : -40]
    })
  }

  // Show loading/placeholder if not ready
  if (!isClient || !leafletLoaded || !MapContainer || !TileLayer || !Marker || !Popup || !L) {
    return (
      <div className={cn("relative bg-muted", className)}>
        <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Loading map...</span>
        </div>
      </div>
    )
  }

  // Default center (fallback if no user location)
  const defaultCenter: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lng]
    : [28.6139, 77.2090] // New Delhi as fallback

  const userIcon = createIcon("#3b82f6", true)
  const placeIcon = createIcon(serviceColors[serviceType])
  const selectedIcon = createIcon("#22c55e")

  return (
    <div className={cn("relative", className)}>
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-[1000] bg-background/50 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      
      {/* Custom marker styles */}
      <style>{`
        .custom-marker {
          background: transparent;
          border: none;
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
        }
        
        .leaflet-popup-content {
          margin: 0;
          min-width: 180px;
        }
        
        .leaflet-popup-tip {
          background: white;
        }
      `}</style>
      
      <MapContainer
        center={defaultCenter}
        zoom={13}
        className="h-full w-full z-0"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User location marker */}
        {userLocation && userIcon && (
          <Marker 
            position={[userLocation.lat, userLocation.lng]} 
            icon={userIcon}
          >
            <Popup>
              <div className="p-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <Navigation className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm font-medium">Your Location</span>
                </div>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Place markers */}
        {places.map((place) => {
          const isSelected = place.id === selectedPlaceId
          const icon = isSelected ? selectedIcon : placeIcon
          
          return icon ? (
            <Marker
              key={place.id}
              position={[place.lat, place.lon]}
              icon={icon}
              eventHandlers={{
                click: () => onPlaceSelect?.(place)
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="text-sm font-semibold mb-1">{place.name}</h3>
                  <p className="text-xs text-muted-foreground mb-1">
                    {serviceLabels[serviceType]}
                  </p>
                  {place.address && (
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {place.address}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium">
                      {place.distance < 1 
                        ? `${Math.round(place.distance * 1000)} m` 
                        : `${place.distance.toFixed(1)} km`}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ) : null
        })}
        
        {/* Fit bounds to show all markers */}
        <FitBounds userLocation={userLocation} places={places} />
      </MapContainer>
      
      {/* Map legend */}
      <div className="absolute bottom-2 left-2 z-[1000] bg-background/90 backdrop-blur-sm rounded-lg p-2 shadow-md border border-border">
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-blue-500 border border-white" />
            <span>You</span>
          </div>
          <div className="flex items-center gap-1">
            <div 
              className="h-3 w-3 rounded-full border border-white" 
              style={{ backgroundColor: serviceColors[serviceType] }}
            />
            <span>{serviceLabels[serviceType]}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
