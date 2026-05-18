"use client"

import { useState, useEffect, useCallback } from "react"

export type NetworkStatus = "online" | "weak" | "offline"

interface NetworkStatusData {
  status: NetworkStatus
  isOnline: boolean
  effectiveType?: string
  downlink?: number
  rtt?: number
}

// Extend Navigator interface for Network Information API
interface NetworkInformation {
  effectiveType: "slow-2g" | "2g" | "3g" | "4g"
  downlink: number
  rtt: number
  saveData: boolean
  addEventListener: (type: string, listener: () => void) => void
  removeEventListener: (type: string, listener: () => void) => void
}

declare global {
  interface Navigator {
    connection?: NetworkInformation
    mozConnection?: NetworkInformation
    webkitConnection?: NetworkInformation
  }
}

function getConnection(): NetworkInformation | undefined {
  if (typeof navigator === "undefined") return undefined
  return navigator.connection || navigator.mozConnection || navigator.webkitConnection
}

function determineNetworkStatus(
  isOnline: boolean,
  connection?: NetworkInformation
): NetworkStatus {
  if (!isOnline) return "offline"
  
  if (connection) {
    // Check effective connection type
    const effectiveType = connection.effectiveType
    if (effectiveType === "slow-2g" || effectiveType === "2g") {
      return "weak"
    }
    
    // Check RTT (round-trip time) - high RTT indicates poor connection
    if (connection.rtt && connection.rtt > 500) {
      return "weak"
    }
    
    // Check downlink speed - low speed indicates poor connection
    if (connection.downlink && connection.downlink < 1) {
      return "weak"
    }
  }
  
  return "online"
}

export function useNetworkStatus(): NetworkStatusData {
  const [status, setStatus] = useState<NetworkStatus>("online")
  const [connectionInfo, setConnectionInfo] = useState<{
    effectiveType?: string
    downlink?: number
    rtt?: number
  }>({})

  const updateStatus = useCallback(() => {
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true
    const connection = getConnection()
    
    const newStatus = determineNetworkStatus(isOnline, connection)
    setStatus(newStatus)
    
    if (connection) {
      setConnectionInfo({
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
      })
    }
  }, [])

  useEffect(() => {
    // Initial check
    updateStatus()
    
    // Listen for online/offline events
    const handleOnline = () => updateStatus()
    const handleOffline = () => setStatus("offline")
    
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    
    // Listen for connection changes if available
    const connection = getConnection()
    if (connection) {
      connection.addEventListener("change", updateStatus)
    }
    
    // Periodic check for weak connection (every 10 seconds)
    const intervalId = setInterval(updateStatus, 10000)
    
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      if (connection) {
        connection.removeEventListener("change", updateStatus)
      }
      clearInterval(intervalId)
    }
  }, [updateStatus])

  return {
    status,
    isOnline: status !== "offline",
    ...connectionInfo,
  }
}
