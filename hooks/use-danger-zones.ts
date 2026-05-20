"use client"

import { useState, useEffect, useRef } from "react"

export interface DangerZoneCheckResult {
  inDangerZone: boolean
  riskLevel: "high" | "medium" | "low"
  confidence: number
  zoneName: string
}

export function useDangerZones(
  location: { lat: number; lng: number } | null,
  enabled: boolean = true
) {
  const [activeWarning, setActiveWarning] = useState<DangerZoneCheckResult | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  
  const lastAlertTimeRef = useRef<number>(0)
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const cooldownDuration = 60 * 1000 // 60 seconds cooldown to avoid voice spam
  const alertDuration = 8 * 1000 // 8 seconds alert duration

  useEffect(() => {
    if (!enabled || !location) {
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current)
      }
      setActiveWarning(null)
      return
    }

    const checkLocationRisk = async () => {
      try {
        setIsChecking(true)
        const response = await fetch("/api/danger/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: location.lat, lng: location.lng })
        })

        if (!response.ok) throw new Error("API error checking danger levels")
        
        const data = await response.json()
        
        if (data.success && data.inDangerZone && data.riskLevel === "high") {
          const now = Date.now()
          if (now - lastAlertTimeRef.current > cooldownDuration) {
            // Trigger new warning alert
            lastAlertTimeRef.current = now
            
            const warningInfo: DangerZoneCheckResult = {
              inDangerZone: data.inDangerZone,
              riskLevel: data.riskLevel,
              confidence: data.confidence,
              zoneName: data.zoneName
            }
            
            setActiveWarning(warningInfo)
            
            // Speak alert automatically
            if (typeof window !== "undefined" && window.speechSynthesis) {
              window.speechSynthesis.cancel()
              const utterance = new SpeechSynthesisUtterance(
                "Accident prone area detected. Please stay alert."
              )
              utterance.rate = 0.95
              utterance.pitch = 1.0
              window.speechSynthesis.speak(utterance)
            }

            // Clear any active warning timeout
            if (warningTimeoutRef.current) {
              clearTimeout(warningTimeoutRef.current)
            }

            // Warning is visible for exactly 8 seconds
            warningTimeoutRef.current = setTimeout(() => {
              setActiveWarning(null)
            }, alertDuration)
          }
        }
      } catch (err) {
        console.warn("Danger zone location check failed:", err)
      } finally {
        setIsChecking(false)
      }
    }

    // Run initial check
    checkLocationRisk()

    // Setup periodic checking every 5 seconds
    const interval = setInterval(checkLocationRisk, 5000)

    return () => {
      clearInterval(interval)
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current)
      }
    }
  }, [location, enabled])

  return {
    activeWarning,
    isChecking
  }
}
