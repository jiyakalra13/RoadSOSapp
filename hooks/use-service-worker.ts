"use client"

import { useEffect, useState, useCallback } from "react"

interface ServiceWorkerState {
  isInstalled: boolean
  isOnline: boolean
  needsUpdate: boolean
  registration: ServiceWorkerRegistration | null
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isInstalled: false,
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    needsUpdate: false,
    registration: null,
  })

  const update = useCallback(async () => {
    if (state.registration) {
      await state.registration.update()
    }
  }, [state.registration])

  const skipWaiting = useCallback(() => {
    if (state.registration?.waiting) {
      state.registration.waiting.postMessage({ type: "SKIP_WAITING" })
    }
  }, [state.registration])

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return
    }

    const handleOnline = () => setState((s) => ({ ...s, isOnline: true }))
    const handleOffline = () => setState((s) => ({ ...s, isOnline: false }))

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Register service worker
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("[PWA] Service worker registered")
        setState((s) => ({ ...s, isInstalled: true, registration }))

        // Check for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setState((s) => ({ ...s, needsUpdate: true }))
              }
            })
          }
        })
      })
      .catch((error) => {
        console.error("[PWA] Service worker registration failed:", error)
      })

    // Handle controller change (new service worker took over)
    let refreshing = false
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    })

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return {
    ...state,
    update,
    skipWaiting,
  }
}
