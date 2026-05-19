"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  ArrowLeft, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  Footprints,
  AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SafeWalkModeProps {
  onBack: () => void
  location: { lat: number; lng: number } | null
  locationLoading?: boolean
  isOnline: boolean
}

export function SafeWalkMode({ onBack, location, locationLoading, isOnline }: SafeWalkModeProps) {
  const [elapsedTime, setElapsedTime] = useState(0)

  // Timer for travel duration
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-card border-b border-border shadow-sm shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="bg-primary/20 p-1.5 rounded-lg">
            <Footprints className="h-4 w-4 text-primary" />
          </div>
          <h1 className="font-semibold text-foreground">SafeWalk Mode</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Status Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="bg-primary rounded-full p-2"
            >
              <ShieldCheck className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <h2 className="font-bold text-foreground">Guardian Active</h2>
              <p className="text-xs text-muted-foreground">Monitoring your safety</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-background px-3 py-1.5 rounded-full shadow-sm">
            <div className="h-2 w-2 bg-success rounded-full animate-pulse" />
            <span className="text-xs font-medium text-success">Secure</span>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 shrink-0">
          <Card className="p-4 flex flex-col items-center justify-center text-center border-border/50 bg-card/50">
            <Clock className="h-5 w-5 text-muted-foreground mb-2" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Duration</p>
            <p className="text-2xl font-bold font-mono tracking-tight text-foreground">{formatTime(elapsedTime)}</p>
          </Card>
          <Card className="p-4 flex flex-col items-center justify-center text-center border-border/50 bg-card/50">
            <MapPin className="h-5 w-5 text-primary mb-2" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Status</p>
            <p className="text-sm font-semibold text-foreground">
              {locationLoading ? "Detecting..." : location ? "Tracking GPS" : "Offline"}
            </p>
          </Card>
        </div>

        {/* Live Location Visualizer */}
        <Card className="flex-1 min-h-[200px] border-border/50 bg-secondary/30 relative overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
          
          <motion.div 
            animate={{ scale: [1, 1.5, 2], opacity: [0.8, 0.4, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut" }}
            className="absolute h-16 w-16 bg-primary rounded-full blur-sm"
          />
          <div className="relative z-10 bg-primary h-4 w-4 rounded-full border-2 border-white shadow-lg shadow-primary/50" />
          
          <div className="absolute bottom-4 left-0 right-0 text-center z-10">
            <p className="text-xs text-muted-foreground font-medium">
              {locationLoading ? "Acquiring satellite lock..." : location ? "Live location actively monitored" : "Waiting for GPS signal"}
            </p>
          </div>
        </Card>

        {/* Instructions */}
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm mt-auto">
          <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Hidden Emergency Triggers
          </h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-6 w-6 rounded bg-secondary flex items-center justify-center shrink-0 font-bold text-foreground">1</div>
              Shake phone vigorously
            </li>
            <li className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-6 w-6 rounded bg-secondary flex items-center justify-center shrink-0 font-bold text-foreground">2</div>
              Press volume button 5 times
            </li>
            <li className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-6 w-6 rounded bg-secondary flex items-center justify-center shrink-0 font-bold text-foreground">3</div>
              Say: "Help me", "RoadSOS activate", or "Call ambulance"
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
