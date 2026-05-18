"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  ArrowLeft, 
  Bell, 
  Shield, 
  Volume2, 
  Smartphone,
  Info,
  ChevronRight,
  Mic,
  Car
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { loadSmartTriggerSettings, saveSmartTriggerSettings, type SmartTriggerSettings } from "@/hooks/use-smart-sos-triggers"

interface SettingsScreenProps {
  onBack: () => void
}

// Storage key for general settings
const GENERAL_SETTINGS_KEY = "roadsos_general_settings"

interface GeneralSettings {
  soundEnabled: boolean
  vibrationEnabled: boolean
  emergencyAlertsEnabled: boolean
  serviceUpdatesEnabled: boolean
}

const defaultGeneralSettings: GeneralSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  emergencyAlertsEnabled: true,
  serviceUpdatesEnabled: false
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [smartTriggers, setSmartTriggers] = useState<SmartTriggerSettings>({
    voiceCommandEnabled: false,
    volumeButtonEnabled: true,
    crashDetectionEnabled: true
  })
  
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(defaultGeneralSettings)

  // Load settings on mount
  useEffect(() => {
    setSmartTriggers(loadSmartTriggerSettings())
    
    try {
      const stored = localStorage.getItem(GENERAL_SETTINGS_KEY)
      if (stored) {
        setGeneralSettings(JSON.parse(stored))
      }
    } catch {
      // Use defaults
    }
  }, [])

  const handleSmartTriggerChange = (key: keyof SmartTriggerSettings, value: boolean) => {
    const updated = { ...smartTriggers, [key]: value }
    setSmartTriggers(updated)
    saveSmartTriggerSettings(updated)
  }

  const handleGeneralSettingChange = (key: keyof GeneralSettings, value: boolean) => {
    const updated = { ...generalSettings, [key]: value }
    setGeneralSettings(updated)
    localStorage.setItem(GENERAL_SETTINGS_KEY, JSON.stringify(updated))
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] bg-background overflow-hidden">
      {/* Header */}
      <div className="bg-background border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-base font-semibold text-foreground">Settings</h1>
            <p className="text-xs text-muted-foreground">App preferences</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Smart SOS Triggers */}
        <Card className="p-3 space-y-3">
          <p className="text-xs font-medium text-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-emergency" />
            Smart SOS Triggers
          </p>
          <FeatureToggle
            label="Voice Commands"
            description={`"Help me", "Call ambulance"`}
            icon={<Mic className="h-3.5 w-3.5 text-muted-foreground" />}
            enabled={smartTriggers.voiceCommandEnabled}
            onChange={(value) => handleSmartTriggerChange("voiceCommandEnabled", value)}
          />
          <FeatureToggle
            label="Volume Button"
            description="Press 3 times quickly"
            icon={<Volume2 className="h-3.5 w-3.5 text-muted-foreground" />}
            enabled={smartTriggers.volumeButtonEnabled}
            onChange={(value) => handleSmartTriggerChange("volumeButtonEnabled", value)}
          />
          <FeatureToggle
            label="Crash Detection"
            description="Auto-detect accidents"
            icon={<Car className="h-3.5 w-3.5 text-muted-foreground" />}
            enabled={smartTriggers.crashDetectionEnabled}
            onChange={(value) => handleSmartTriggerChange("crashDetectionEnabled", value)}
          />
          <p className="text-[10px] text-muted-foreground pt-1 border-t border-border">
            Smart triggers show a confirmation before activating SOS
          </p>
        </Card>

        {/* Notifications */}
        <Card className="p-3 space-y-3">
          <p className="text-xs font-medium text-foreground flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Notifications
          </p>
          <FeatureToggle
            label="Emergency Alerts"
            description="Nearby emergencies"
            enabled={generalSettings.emergencyAlertsEnabled}
            onChange={(value) => handleGeneralSettingChange("emergencyAlertsEnabled", value)}
          />
          <FeatureToggle
            label="Service Updates"
            description="New features & tips"
            enabled={generalSettings.serviceUpdatesEnabled}
            onChange={(value) => handleGeneralSettingChange("serviceUpdatesEnabled", value)}
          />
        </Card>

        {/* General */}
        <Card className="p-3 space-y-3">
          <p className="text-xs font-medium text-foreground flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary" />
            General
          </p>
          <FeatureToggle
            label="Sound Effects"
            description="SOS beeps & alerts"
            enabled={generalSettings.soundEnabled}
            onChange={(value) => handleGeneralSettingChange("soundEnabled", value)}
          />
          <FeatureToggle
            label="Vibration"
            description="Haptic feedback"
            enabled={generalSettings.vibrationEnabled}
            onChange={(value) => handleGeneralSettingChange("vibrationEnabled", value)}
          />
        </Card>

        {/* About */}
        <Card className="p-3">
          <button className="w-full flex items-center justify-between py-1">
            <div className="flex items-center gap-3">
              <Info className="h-4 w-4 text-muted-foreground" />
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">About RoadSOS</p>
                <p className="text-xs text-muted-foreground">Version 1.0.0</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </Card>
      </div>
    </div>
  )
}

function FeatureToggle({
  label,
  description,
  icon,
  enabled,
  onChange
}: {
  label: string
  description: string
  icon?: React.ReactNode
  enabled: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={cn(
          "w-10 h-5 rounded-full transition-colors relative",
          enabled ? "bg-primary" : "bg-muted"
        )}
      >
        <motion.div 
          animate={{ x: enabled ? 20 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm"
        />
      </button>
    </div>
  )
}
