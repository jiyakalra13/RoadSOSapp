"use client"

import { useState, useCallback } from "react"
import { BottomNav } from "@/components/bottom-nav"
import { HomeDashboard } from "@/components/home-dashboard"
import { SOSFlow } from "@/components/sos-flow"
import { NearbyServices } from "@/components/nearby-services"
import { FirstAidChat } from "@/components/first-aid-chat"
import { ProfileScreen } from "@/components/profile-screen"
import { ServicesOverview } from "@/components/services-overview"
import { SettingsScreen } from "@/components/settings-screen"
import { OnboardingScreen } from "@/components/onboarding-screen"
import { NetworkStatusIndicator } from "@/components/network-status-indicator"
import { SOSConfirmationOverlay } from "@/components/sos-confirmation-overlay"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import { useLocation } from "@/hooks/use-location"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useNetworkStatus } from "@/hooks/use-network-status"
import { useSmartSOSTriggers } from "@/hooks/use-smart-sos-triggers"

type ActiveView = 
  | "home" 
  | "services" 
  | "services-ambulance" 
  | "services-police" 
  | "services-vehicle"
  | "firstaid" 
  | "profile"
  | "settings"

export default function RoadSOSApp() {
  const [activeTab, setActiveTab] = useState("home")
  const [activeView, setActiveView] = useState<ActiveView>("home")
  const [sosActive, setSOSActive] = useState(false)
  
  // Smart SOS trigger confirmation state
  const [showSOSConfirmation, setShowSOSConfirmation] = useState(false)
  const [sosTriggerType, setSOSTriggerType] = useState<"voice" | "volume" | "crash" | null>(null)
  
  // Network status management with detailed states
  const { status: networkStatus, isOnline } = useNetworkStatus()
  
  // User profile management
  const { 
    profile, 
    isLoading: profileLoading, 
    hasCompletedOnboarding, 
    completeOnboarding,
    getEmergencyNumbers,
    saveProfile
  } = useUserProfile()
  
  // Use real GPS location
  const { location: gpsLocation, error: locationError, isLoading: locationLoading, permissionStatus, requestLocation } = useLocation({
    enableHighAccuracy: true,
    watchPosition: true,
    timeout: 15000,
    maximumAge: 0
  })

  // Smart SOS trigger handler
  const handleSmartTrigger = useCallback((triggerType: "voice" | "volume" | "crash") => {
    if (sosActive) return // Don't trigger if SOS is already active
    setSOSTriggerType(triggerType)
    setShowSOSConfirmation(true)
  }, [sosActive])

  // Smart SOS triggers (voice commands, volume button, crash detection)
  const { lastDetectedCommand } = useSmartSOSTriggers({
    onTrigger: handleSmartTrigger,
    enabled: !sosActive // Disable triggers when SOS is already active
  })

  // Convert location format for components
  const location = gpsLocation ? { lat: gpsLocation.lat, lng: gpsLocation.lng } : null

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setActiveView(tab as ActiveView)
  }

  const handleServiceSelect = (service: string) => {
    if (service === "firstaid") {
      setActiveTab("firstaid")
      setActiveView("firstaid")
    } else if (service === "vehicle" || service === "ambulance" || service === "police") {
      setActiveView(`services-${service}` as ActiveView)
    }
  }

  const handleSOSPress = () => {
    setSOSActive(true)
  }

  const handleSOSCancel = () => {
    setSOSActive(false)
  }

  const handleSOSComplete = () => {
    // SOS is now active, handled in SOSFlow component
  }

  // Smart trigger confirmation handlers
  const handleConfirmSmartTrigger = () => {
    setShowSOSConfirmation(false)
    setSOSActive(true)
  }

  const handleCancelSmartTrigger = () => {
    setShowSOSConfirmation(false)
    setSOSTriggerType(null)
  }

  const handleBack = () => {
    if (activeView.startsWith("services-")) {
      setActiveView("services")
    } else {
      setActiveTab("home")
      setActiveView("home")
    }
  }

  // Handle onboarding completion
  const handleOnboardingComplete = (profileData: Parameters<typeof completeOnboarding>[0]) => {
    completeOnboarding(profileData)
  }

  // Show loading state while checking profile
  if (profileLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </main>
    )
  }

  // Show onboarding if not completed
  if (!hasCompletedOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />
  }

  const renderView = () => {
    switch (activeView) {
      case "home":
        return (
          <HomeDashboard
            onSOSPress={handleSOSPress}
            onServiceSelect={handleServiceSelect}
            isOnline={isOnline}
            location={location}
            locationLoading={locationLoading}
            locationError={locationError}
            permissionStatus={permissionStatus}
            requestLocation={requestLocation}
            address={gpsLocation?.address}
            accuracy={gpsLocation?.accuracy}
          />
        )
      case "services":
        return (
          <ServicesOverview
            onBack={handleBack}
            onSelectService={(service) => setActiveView(`services-${service}` as ActiveView)}
            location={location}
          />
        )
      case "services-ambulance":
        return (
          <NearbyServices
            serviceType="ambulance"
            onBack={handleBack}
            location={location}
          />
        )
      case "services-police":
        return (
          <NearbyServices
            serviceType="police"
            onBack={handleBack}
            location={location}
          />
        )
      case "services-vehicle":
        return (
          <NearbyServices
            serviceType="vehicle"
            onBack={handleBack}
            location={location}
          />
        )
      case "firstaid":
        return (
          <FirstAidChat
            onBack={handleBack}
            isOnline={isOnline}
          />
        )
      case "profile":
        return (
          <ProfileScreen 
            onBack={handleBack} 
            userProfile={profile}
            onSaveProfile={saveProfile}
          />
        )
      case "settings":
        return (
          <SettingsScreen onBack={handleBack} />
        )
      default:
        return null
    }
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Network Status Indicator - Always visible at top */}
      {!sosActive && (
        <NetworkStatusIndicator status={networkStatus} />
      )}
      
      {/* Main Content */}
      <div className="flex-1">
        {renderView()}
      </div>
      
      {/* Bottom Navigation */}
      {!sosActive && (
        <BottomNav 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          isOnline={isOnline}
        />
      )}
      
      {/* SOS Flow Overlay */}
      <SOSFlow
        isActive={sosActive}
        onCancel={handleSOSCancel}
        onComplete={handleSOSComplete}
        location={location}
        address={gpsLocation?.address}
        emergencyNumbers={getEmergencyNumbers()}
        emergencyContacts={profile?.emergencyContacts || []}
        isOnline={isOnline}
        userName={profile?.fullName}
      />

      {/* Smart SOS Trigger Confirmation Overlay */}
      <SOSConfirmationOverlay
        isVisible={showSOSConfirmation}
        triggerType={sosTriggerType}
        detectedCommand={lastDetectedCommand}
        onConfirm={handleConfirmSmartTrigger}
        onCancel={handleCancelSmartTrigger}
        autoConfirmDelay={10}
      />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </main>
  )
}
