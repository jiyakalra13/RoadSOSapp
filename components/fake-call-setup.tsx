"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, PhoneCall, Clock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface FakeCallSetupProps {
  onBack: () => void
  onStartCall: (callerName: string, delay: number) => void
}

export function FakeCallSetup({ onBack, onStartCall }: FakeCallSetupProps) {
  const [callerName, setCallerName] = useState("Mom")
  const [delay, setDelay] = useState(5) // in seconds

  const delayOptions = [
    { label: "5 sec", value: 5 },
    { label: "10 sec", value: 10 },
    { label: "30 sec", value: 30 },
  ]

  const handleStart = () => {
    onStartCall(callerName || "Unknown Caller", delay)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-card border-b border-border shadow-sm shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="bg-secondary p-1.5 rounded-lg">
            <PhoneCall className="h-4 w-4 text-primary" />
          </div>
          <h1 className="font-semibold text-foreground">Fake Call</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        <div className="text-center">
          <h2 className="text-lg font-bold text-foreground">Escape Unsafe Situations</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Schedule a realistic incoming call to help you excuse yourself.
          </p>
        </div>

        <Card className="p-4 border-border/50 bg-card/50">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-2">
            <User className="h-4 w-4" /> Caller Name
          </label>
          <Input 
            value={callerName}
            onChange={(e) => setCallerName(e.target.value)}
            placeholder="e.g. Mom, Dad, Boss"
            className="bg-background border-border/50"
          />
        </Card>

        <Card className="p-4 border-border/50 bg-card/50">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4" /> Delay Time
          </label>
          <div className="grid grid-cols-3 gap-2">
            {delayOptions.map((option) => (
              <Button
                key={option.value}
                variant={delay === option.value ? "default" : "outline"}
                onClick={() => setDelay(option.value)}
                className={
                  delay === option.value 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "bg-background border-border/50 hover:bg-accent/50"
                }
              >
                {option.label}
              </Button>
            ))}
          </div>
        </Card>

        <div className="mt-auto">
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button 
              size="lg" 
              onClick={handleStart}
              className="w-full h-14 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20"
            >
              <PhoneCall className="h-5 w-5 mr-2" />
              Start Fake Call
            </Button>
          </motion.div>
          <p className="text-[10px] text-center text-muted-foreground mt-3 px-4">
            Note: Your phone must not be muted for the ringtone to play.
          </p>
        </div>
      </div>
    </div>
  )
}
