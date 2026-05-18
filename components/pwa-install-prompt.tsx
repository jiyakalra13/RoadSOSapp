"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Download, X, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useServiceWorker } from "@/hooks/use-service-worker"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [showUpdateBanner, setShowUpdateBanner] = useState(false)
  const { needsUpdate, skipWaiting, isInstalled } = useServiceWorker()

  useEffect(() => {
    // Check if already installed as PWA
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    if (isStandalone) return

    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      // Show install banner after a delay
      setTimeout(() => setShowInstallBanner(true), 3000)
    }

    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  useEffect(() => {
    if (needsUpdate) {
      setShowUpdateBanner(true)
    }
  }, [needsUpdate])

  const handleInstall = async () => {
    if (!installPrompt) return

    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice

    if (outcome === "accepted") {
      setInstallPrompt(null)
      setShowInstallBanner(false)
    }
  }

  const handleUpdate = () => {
    skipWaiting()
    setShowUpdateBanner(false)
  }

  return (
    <>
      {/* Install Banner */}
      <AnimatePresence>
        {showInstallBanner && installPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-4 right-4 z-50"
          >
            <div className="bg-card border border-border rounded-xl p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-emergency/10 flex items-center justify-center shrink-0">
                  <Download className="h-5 w-5 text-emergency" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">
                    Install RoadSOS
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Install for quick access and full offline support
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      onClick={handleInstall}
                      size="sm"
                      className="h-8 bg-emergency hover:bg-emergency/90 text-white"
                    >
                      Install
                    </Button>
                    <Button
                      onClick={() => setShowInstallBanner(false)}
                      variant="ghost"
                      size="sm"
                      className="h-8"
                    >
                      Not now
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={() => setShowInstallBanner(false)}
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Banner */}
      <AnimatePresence>
        {showUpdateBanner && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-4 right-4 z-50"
          >
            <div className="bg-card border border-border rounded-xl p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <RefreshCw className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">
                    Update Available
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    A new version is ready. Refresh to update.
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      onClick={handleUpdate}
                      size="sm"
                      className="h-8"
                    >
                      Refresh
                    </Button>
                    <Button
                      onClick={() => setShowUpdateBanner(false)}
                      variant="ghost"
                      size="sm"
                      className="h-8"
                    >
                      Later
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={() => setShowUpdateBanner(false)}
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
