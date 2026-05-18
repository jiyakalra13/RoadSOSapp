"use client"

import { useState, useEffect, useCallback } from "react"

export interface LocationData {
  lat: number
  lng: number
  accuracy: number
  timestamp: number
  address?: string
}

export interface LocationState {
  location: LocationData | null
  error: string | null
  isLoading: boolean
  permissionStatus: "prompt" | "granted" | "denied" | "unsupported"
}

export function useLocation(options?: {
  enableHighAccuracy?: boolean
  watchPosition?: boolean
  timeout?: number
  maximumAge?: number
}) {
  const {
    enableHighAccuracy = true,
    watchPosition = true,
    timeout = 10000,
    maximumAge = 0,
  } = options || {}

  const [state, setState] = useState<LocationState>({
    location: null,
    error: null,
    isLoading: true,
    permissionStatus: "prompt",
  })

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string | undefined> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "User-Agent": "RoadSOS Emergency App",
          },
        }
      )
      if (response.ok) {
        const data = await response.json()
        return data.display_name || undefined
      }
    } catch {
      // Silently fail - address is optional
    }
    return undefined
  }, [])

  const handleSuccess = useCallback(
    async (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords
      
      // Get address in background
      const address = await reverseGeocode(latitude, longitude)
      
      setState((prev) => ({
        ...prev,
        location: {
          lat: latitude,
          lng: longitude,
          accuracy,
          timestamp: position.timestamp,
          address,
        },
        error: null,
        isLoading: false,
        permissionStatus: "granted",
      }))
    },
    [reverseGeocode]
  )

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage: string
    let permissionStatus: LocationState["permissionStatus"] = "denied"

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "Location permission denied. Please enable location access in your browser settings."
        permissionStatus = "denied"
        break
      case error.POSITION_UNAVAILABLE:
        errorMessage = "Location unavailable. Please check your GPS settings."
        permissionStatus = "granted"
        break
      case error.TIMEOUT:
        errorMessage = "Location request timed out. Please try again."
        permissionStatus = "granted"
        break
      default:
        errorMessage = "An unknown error occurred while getting your location."
        permissionStatus = "granted"
    }

    setState((prev) => ({
      ...prev,
      error: errorMessage,
      isLoading: false,
      permissionStatus,
    }))
  }, [])

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation is not supported by your browser.",
        isLoading: false,
        permissionStatus: "unsupported",
      }))
      return
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    const geoOptions: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    }

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, geoOptions)
  }, [enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError])

  // Initial location request and watch setup
  useEffect(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation is not supported by your browser.",
        isLoading: false,
        permissionStatus: "unsupported",
      }))
      return
    }

    // Check permission status if available
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        setState((prev) => ({
          ...prev,
          permissionStatus: result.state as LocationState["permissionStatus"],
        }))

        result.onchange = () => {
          setState((prev) => ({
            ...prev,
            permissionStatus: result.state as LocationState["permissionStatus"],
          }))
        }
      }).catch(() => {
        // Permissions API not fully supported
      })
    }

    const geoOptions: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, geoOptions)

    // Set up position watcher if enabled
    let watchId: number | undefined

    if (watchPosition) {
      watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, geoOptions)
    }

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [enableHighAccuracy, timeout, maximumAge, watchPosition, handleSuccess, handleError])

  return {
    ...state,
    requestLocation,
  }
}

// Helper to open Google Maps with directions
export function openGoogleMapsDirections(
  userLocation: { lat: number; lng: number } | null,
  destination: { lat: number; lng: number; name?: string }
) {
  const destinationParam = `${destination.lat},${destination.lng}`
  
  if (userLocation) {
    const originParam = `${userLocation.lat},${userLocation.lng}`
    window.open(
      `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destinationParam}&travelmode=driving`,
      "_blank"
    )
  } else {
    // If no user location, just open destination (Maps will use device location)
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${destinationParam}&travelmode=driving`,
      "_blank"
    )
  }
}

// Helper to share location via SMS/other apps
export function shareLocation(location: { lat: number; lng: number; address?: string }) {
  const mapsUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`
  const message = location.address
    ? `My emergency location: ${location.address}\n${mapsUrl}`
    : `My emergency location: ${mapsUrl}`

  if (navigator.share) {
    navigator.share({
      title: "Emergency Location",
      text: message,
      url: mapsUrl,
    }).catch(() => {
      // User cancelled or share failed
    })
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(message).catch(() => {
      // Clipboard failed
    })
  }
}
