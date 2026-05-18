"use client"

import { motion, AnimatePresence } from "framer-motion"
import { 
  Wifi, 
  WifiOff, 
  Signal,
  MapPin,
  MessageSquare,
  Database,
  HeartPulse,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { NetworkStatus } from "@/hooks/use-network-status"

interface NetworkStatusIndicatorProps {
  status: NetworkStatus
  className?: string
}

const statusConfig = {
  online: {
    icon: Wifi,
    label: "Online",
    description: "Live protection active",
    bgColor: "bg-success/10",
    borderColor: "border-success/30",
    textColor: "text-success",
    dotColor: "bg-success",
    badges: [
      { icon: Wifi, label: "WiFi" },
      { icon: MapPin, label: "GPS" },
      { icon: Signal, label: "Live Sync" },
    ],
  },
  weak: {
    icon: Signal,
    label: "Weak Network",
    description: "Backup systems preparing",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/30",
    textColor: "text-warning",
    dotColor: "bg-warning",
    badges: [
      { icon: RefreshCw, label: "Retrying" },
      { icon: Database, label: "Caching" },
    ],
  },
  offline: {
    icon: WifiOff,
    label: "Offline Mode",
    description: "SMS & local emergency tools active",
    bgColor: "bg-emergency/10",
    borderColor: "border-emergency/30",
    textColor: "text-emergency",
    dotColor: "bg-emergency",
    badges: [
      { icon: MessageSquare, label: "SMS Active" },
      { icon: MapPin, label: "Cached Maps" },
      { icon: HeartPulse, label: "Offline First Aid" },
    ],
  },
}

export function NetworkStatusIndicator({ status, className }: NetworkStatusIndicatorProps) {
  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "mx-4 mt-2 mb-1",
          className
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl border backdrop-blur-sm",
            config.bgColor,
            config.borderColor
          )}
        >
          {/* Animated dot indicator */}
          <div className="relative">
            <motion.div
              animate={status === "weak" ? { 
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1]
              } : status === "online" ? {
                scale: [1, 1.1, 1]
              } : {}}
              transition={{ 
                duration: status === "weak" ? 1.5 : 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={cn(
                "h-2 w-2 rounded-full",
                config.dotColor
              )}
            />
            {status === "online" && (
              <motion.div
                animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className={cn(
                  "absolute inset-0 rounded-full",
                  config.dotColor
                )}
              />
            )}
          </div>

          {/* Status icon */}
          <StatusIcon className={cn("h-4 w-4", config.textColor)} />

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={cn("text-xs font-semibold", config.textColor)}>
                {config.label}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {config.description}
              </span>
            </div>
          </div>

          {/* Feature badges */}
          <div className="flex items-center gap-1">
            {config.badges.map((badge, index) => {
              const BadgeIcon = badge.icon
              return (
                <motion.div
                  key={badge.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    ...(status === "weak" && badge.label === "Retrying" ? {
                      rotate: [0, 360]
                    } : {})
                  }}
                  transition={{ 
                    delay: index * 0.1,
                    ...(status === "weak" && badge.label === "Retrying" ? {
                      rotate: { duration: 2, repeat: Infinity, ease: "linear" }
                    } : {})
                  }}
                  className={cn(
                    "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px]",
                    status === "online" && "bg-success/20 text-success",
                    status === "weak" && "bg-warning/20 text-warning",
                    status === "offline" && "bg-emergency/20 text-emergency"
                  )}
                >
                  <BadgeIcon className="h-2.5 w-2.5" />
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
