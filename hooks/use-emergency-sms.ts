"use client"

import { useCallback, useRef, useState } from "react"

interface EmergencyContact {
  id: string
  name: string
  phone: string
  relationship: string
}

interface LocationData {
  lat: number
  lng: number
  address?: string
  timestamp?: number
}

interface SMSStatus {
  contactId: string
  contactName: string
  status: "pending" | "sending" | "sent" | "failed"
  error?: string
}

// Store last known location for offline use
const LAST_LOCATION_KEY = "roadsos_last_location"

export function saveLastKnownLocation(location: LocationData) {
  if (typeof window !== "undefined") {
    localStorage.setItem(
      LAST_LOCATION_KEY,
      JSON.stringify({
        ...location,
        savedAt: Date.now(),
      })
    )
  }
}

export function getLastKnownLocation(): (LocationData & { savedAt: number }) | null {
  if (typeof window === "undefined") return null
  
  try {
    const stored = localStorage.getItem(LAST_LOCATION_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Parsing failed
  }
  return null
}

function formatLocationMessage(
  location: LocationData | null,
  isLive: boolean,
  userName?: string
): string {
  const name = userName || "Someone"
  const mapsUrl = location
    ? `https://www.google.com/maps?q=${location.lat},${location.lng}`
    : null

  if (!location) {
    return `EMERGENCY SOS from ${name}! They need help urgently. Location unavailable - please call them immediately!`
  }

  const locationText = location.address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
  const liveIndicator = isLive ? "[LIVE]" : "[Last Known]"

  return `EMERGENCY SOS! ${name} needs help! ${liveIndicator} Location: ${locationText}. Map: ${mapsUrl}. Please respond immediately or call emergency services!`
}

function formatUpdateMessage(
  location: LocationData,
  userName?: string
): string {
  const name = userName || "User"
  const mapsUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`
  const locationText = location.address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`

  return `[SOS UPDATE] ${name}'s current location: ${locationText}. Map: ${mapsUrl}`
}

// Generate SMS URL for mobile devices
function generateSmsUrl(phone: string, message: string): string {
  // Clean phone number
  const cleanPhone = phone.replace(/[^\d+]/g, "")
  
  // Encode message for URL
  const encodedMessage = encodeURIComponent(message)
  
  // Use different format based on device
  // iOS uses &body=, Android uses ?body=
  // Using the more universal format that works on both
  return `sms:${cleanPhone}?body=${encodedMessage}`
}

// Open SMS app with pre-filled message
function openSmsApp(phone: string, message: string): void {
  const url = generateSmsUrl(phone, message)
  window.location.href = url
}

// Send SMS to multiple contacts via backend API
async function sendSmsToContacts(
  contacts: EmergencyContact[],
  location: LocationData | null,
  isLive: boolean,
  userName?: string,
  onStatusUpdate?: (status: SMSStatus) => void
): Promise<SMSStatus[]> {
  const results: SMSStatus[] = []
  
  // Set initial status
  for (const contact of contacts) {
    const status: SMSStatus = {
      contactId: contact.id,
      contactName: contact.name,
      status: "sending",
    }
    results.push(status)
    onStatusUpdate?.(status)
  }

  try {
    const payload = {
      userId: userName || 'Anonymous',
      triggerType: 'sos',
      location: location,
      time: new Date().toISOString(),
      contacts: contacts,
      status: 'active'
    }

    const response = await fetch('/api/sos/send-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) throw new Error('Failed to send alerts')

    for (const contact of contacts) {
      const status: SMSStatus = {
        contactId: contact.id,
        contactName: contact.name,
        status: "sent",
      }
      onStatusUpdate?.(status)
      const index = results.findIndex(s => s.contactId === contact.id)
      if (index >= 0) results[index] = status
    }
  } catch (error) {
    for (const contact of contacts) {
      const status: SMSStatus = {
        contactId: contact.id,
        contactName: contact.name,
        status: "failed",
        error: error instanceof Error ? error.message : "Failed to send SMS",
      }
      onStatusUpdate?.(status)
      const index = results.findIndex(s => s.contactId === contact.id)
      if (index >= 0) results[index] = status
    }
  }

  return results
}

export function useEmergencySMS() {
  const [smsStatuses, setSmsStatuses] = useState<SMSStatus[]>([])
  const [isSending, setIsSending] = useState(false)
  const locationUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const sentInitialSmsRef = useRef(false)

  const handleStatusUpdate = useCallback((status: SMSStatus) => {
    setSmsStatuses((prev) => {
      const existing = prev.findIndex((s) => s.contactId === status.contactId)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = status
        return updated
      }
      return [...prev, status]
    })
  }, [])

  // Send initial SOS SMS to all emergency contacts
  const sendInitialSOS = useCallback(
    async (
      contacts: EmergencyContact[],
      currentLocation: LocationData | null,
      isOnline: boolean,
      userName?: string
    ) => {
      if (contacts.length === 0 || sentInitialSmsRef.current) return

      setIsSending(true)
      sentInitialSmsRef.current = true

      // Determine which location to use
      let locationToSend = currentLocation
      let isLive = isOnline && !!currentLocation

      if (!currentLocation || !isOnline) {
        // Use last known location in offline mode
        const lastLocation = getLastKnownLocation()
        if (lastLocation) {
          locationToSend = lastLocation
          isLive = false
        }
      }

      // Save current location as last known
      if (currentLocation) {
        saveLastKnownLocation(currentLocation)
      }

      const message = formatLocationMessage(locationToSend, isLive, userName)
      
      await sendSmsToContacts(contacts, locationToSend, isLive, userName, handleStatusUpdate)
      
      setIsSending(false)
    },
    [handleStatusUpdate]
  )

  // Send location update SMS (for live tracking in online mode)
  const sendLocationUpdate = useCallback(
    async (
      contacts: EmergencyContact[],
      location: LocationData,
      userName?: string
    ) => {
      if (contacts.length === 0) return

      // Save as last known location
      saveLastKnownLocation(location)

      const message = formatUpdateMessage(location, userName)
      
      await sendSmsToContacts(contacts, location, true, userName)
      
      return message
    },
    []
  )

  // Start periodic location updates (call this when SOS is active and online)
  const startLiveUpdates = useCallback(
    (
      contacts: EmergencyContact[],
      getLocation: () => LocationData | null,
      userName?: string,
      intervalMs: number = 60000 // Default 1 minute
    ) => {
      // Clear any existing interval
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current)
      }

      locationUpdateIntervalRef.current = setInterval(() => {
        const location = getLocation()
        if (location) {
          saveLastKnownLocation(location)
          // Automatically send updates to emergency contacts every interval
          sendSmsToContacts(contacts, location, true, userName)
        }
      }, intervalMs)
    },
    []
  )

  // Stop live updates
  const stopLiveUpdates = useCallback(() => {
    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current)
      locationUpdateIntervalRef.current = null
    }
  }, [])

  // Reset state
  const reset = useCallback(() => {
    setSmsStatuses([])
    setIsSending(false)
    sentInitialSmsRef.current = false
    stopLiveUpdates()
  }, [stopLiveUpdates])

  // Generate a shareable message for manual sending
  const getShareableMessage = useCallback(
    (location: LocationData | null, isOnline: boolean, userName?: string) => {
      let locationToUse = location
      let isLive = isOnline && !!location

      if (!location || !isOnline) {
        const lastLocation = getLastKnownLocation()
        if (lastLocation) {
          locationToUse = lastLocation
          isLive = false
        }
      }

      return formatLocationMessage(locationToUse, isLive, userName)
    },
    []
  )

  // Bulk send to all contacts (uses backend API)
  const sendToAllContacts = useCallback(
    async (
      contacts: EmergencyContact[],
      location: LocationData | null,
      isOnline: boolean,
      userName?: string
    ) => {
      let locationToUse = location
      let isLive = isOnline && !!location

      if (!location || !isOnline) {
        const lastLocation = getLastKnownLocation()
        if (lastLocation) {
          locationToUse = lastLocation
          isLive = false
        }
      }

      await sendSmsToContacts(contacts, locationToUse, isLive, userName, handleStatusUpdate)
      return true
    },
    [handleStatusUpdate]
  )

  return {
    smsStatuses,
    isSending,
    sendInitialSOS,
    sendLocationUpdate,
    startLiveUpdates,
    stopLiveUpdates,
    reset,
    getShareableMessage,
    sendToAllContacts,
  }
}
