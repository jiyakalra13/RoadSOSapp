"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, X, Mic, Volume2, Car } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SOSConfirmationOverlayProps {
  isVisible: boolean
  triggerType: "voice" | "volume" | "crash" | null
  detectedCommand?: string | null
  onConfirm: () => void
  onCancel: () => void
  autoConfirmDelay?: number // Auto-confirm after X seconds (for crash detection)
}

export function SOSConfirmationOverlay({
  isVisible,
  triggerType,
  detectedCommand,
  onConfirm,
  onCancel,
  autoConfirmDelay = 10
}: SOSConfirmationOverlayProps) {
  const [countdown, setCountdown] = useState(autoConfirmDelay)

  // Reset countdown when overlay becomes visible
  useEffect(() => {
    if (isVisible) {
      setCountdown(autoConfirmDelay)
    }
  }, [isVisible, autoConfirmDelay])

  // Auto-confirm countdown for crash detection
  useEffect(() => {
    if (!isVisible || triggerType !== "crash") return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          onConfirm()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isVisible, triggerType, onConfirm])

  const getTriggerIcon = useCallback(() => {
    switch (triggerType) {
      case "voice":
        return <Mic className="h-6 w-6" />
      case "volume":
        return <Volume2 className="h-6 w-6" />
      case "crash":
        return <Car className="h-6 w-6" />
      default:
        return <AlertTriangle className="h-6 w-6" />
    }
  }, [triggerType])

  const getTriggerTitle = useCallback(() => {
    switch (triggerType) {
      case "voice":
        return "Voice Command Detected"
      case "volume":
        return "Volume Button Trigger"
      case "crash":
        return "Possible Crash Detected"
      default:
        return "SOS Trigger Detected"
    }
  }, [triggerType])

  const getTriggerDescription = useCallback(() => {
    switch (triggerType) {
      case "voice":
        return detectedCommand 
          ? `Heard: "${detectedCommand}"`
          : "Emergency voice command detected"
      case "volume":
        return "Volume button pressed 3 times"
      case "crash":
        return `Auto-activating in ${countdown}s if no response`
      default:
        return "Emergency trigger activated"
    }
  }, [triggerType, detectedCommand, countdown])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-xs bg-background rounded-2xl overflow-hidden shadow-2xl border border-border"
          >
            {/* Header */}
            <div className="bg-emergency p-4 text-white">
              <div className="flex items-center justify-between mb-3">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center"
                >
                  {getTriggerIcon()}
                </motion.div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onCancel}
                  className="h-8 w-8 rounded-full text-white hover:bg-white/20 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <h2 className="text-lg font-bold">{getTriggerTitle()}</h2>
              <p className="text-sm opacity-90">{getTriggerDescription()}</p>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Do you need emergency assistance?
              </p>

              {/* Countdown bar for crash detection */}
              {triggerType === "crash" && (
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: autoConfirmDelay, ease: "linear" }}
                    className="h-full bg-emergency"
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1 h-11"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onConfirm}
                  className="flex-1 h-11 bg-emergency hover:bg-emergency/90 text-white"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Activate SOS
                </Button>
              </div>

              <p className="text-[10px] text-muted-foreground text-center">
                {triggerType === "crash" 
                  ? "Tap Cancel if you are okay"
                  : "This will alert emergency services and contacts"
                }
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
