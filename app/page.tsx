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
import { SafeWalkMode } from "@/components/safewalk-mode"
import { FakeCallSetup } from "@/components/fake-call-setup"
import { FakeCallScreen } from "@/components/fake-call-screen"
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
  | "safewalk"
  | "fakecall-setup"
  | "fakecall-active"

export default function RoadSOSApp() {
  const [activeTab, setActiveTab] = useState("home")
  const [activeView, setActiveView] = useState<ActiveView>("home")
  const [sosActive, setSOSActive] = useState(false)
  const [autoCalledAmbulance, setAutoCalledAmbulance] = useState(false)
  
  // Smart SOS trigger confirmation state
  const [showSOSConfirmation, setShowSOSConfirmation] = useState(false)
  const [sosTriggerType, setSOSTriggerType] = useState<"voice" | "volume" | "crash" | "shake" | null>(null)
  const [sosCountdownDuration, setSosCountdownDuration] = useState(5)
  const [fakeCallConfig, setFakeCallConfig] = useState<{ callerName: string; delay: number }>({ callerName: "Mom", delay: 5 })
  
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

  // Helper to initiate ambulance call
  const callAmbulance = useCallback(() => {
    const numbers = getEmergencyNumbers()
    window.location.href = `tel:${numbers.ambulance}`
  }, [getEmergencyNumbers])

  // Smart SOS trigger handler
  const handleSmartTrigger = useCallback((triggerType: "voice" | "volume" | "crash" | "shake", command?: string) => {
    if (sosActive) return // Don't trigger if SOS is already active
    
    // Check if SafeWalk mode is active to apply 10s countdown
    const isSafeWalk = activeView === "safewalk"
    setSosCountdownDuration(isSafeWalk ? 10 : 5)

    // For volume button trigger, directly activate SOS and call ambulance
    if (triggerType === "volume") {
      setSOSActive(true)
      setAutoCalledAmbulance(true)
      // Call ambulance after a brief delay to allow SOS flow to start
      setTimeout(() => {
        callAmbulance()
      }, 500)
      return
    }

    if (triggerType === "voice" && command) {
      const normalized = command.toLowerCase()
      const emergencyNums = getEmergencyNumbers()
      
      // Initiate call directly if command specifies who to call
      if (normalized.includes("police")) {
        window.location.href = `tel:${emergencyNums.police}`
        return
      } else if (normalized.includes("ambulance")) {
        window.location.href = `tel:${emergencyNums.ambulance}`
        return
      } else if (normalized.includes("fire")) {
        window.location.href = `tel:${emergencyNums.fire}`
        return
      }
    }
    
    setSOSTriggerType(triggerType)
    setShowSOSConfirmation(true)
  }, [sosActive, callAmbulance, getEmergencyNumbers])

  // Smart SOS triggers (voice commands, volume button, crash detection)
  const { 
    lastDetectedCommand, 
    isVoiceListening, 
    spokenText,
    startVoiceListening,
    settings: smartTriggerSettings, 
    micPermission, 
    requestMicrophonePermission,
    audioLevel
  } = useSmartSOSTriggers({
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
    } else if (service === "safewalk") {
      setActiveView("safewalk")
    } else if (service === "fakecall") {
      setActiveView("fakecall-setup")
    } else if (service === "vehicle" || service === "ambulance" || service === "police") {
      setActiveView(`services-${service}` as ActiveView)
    }
  }

  const handleSOSPress = () => {
    setSOSActive(true)
  }

  const handleSOSCancel = () => {
    setSOSActive(false)
    setAutoCalledAmbulance(false)
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
            isVoiceListening={isVoiceListening}
            spokenText={spokenText}
            voiceEnabled={smartTriggerSettings.voiceCommandEnabled}
            micPermission={micPermission}
            onRequestMicPermission={requestMicrophonePermission}
            startVoiceListening={startVoiceListening}
            audioLevel={audioLevel}
            userGender={profile?.gender}
          />
        )
      case "services":
        return (
          <ServicesOverview
            onBack={handleBack}
            onSelectService={(service) => setActiveView(`services-${service}` as ActiveView)}
            location={location}
            address={gpsLocation?.address}
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
      case "safewalk":
        return (
          <SafeWalkMode 
            onBack={handleBack}
            location={location}
            locationLoading={locationLoading}
            isOnline={isOnline}
          />
        )
      case "fakecall-setup":
        return (
          <FakeCallSetup 
            onBack={handleBack}
            onStartCall={(callerName, delay) => {
              setFakeCallConfig({ callerName, delay })
              setActiveView("fakecall-active")
            }}
          />
        )
      case "fakecall-active":
        return (
          <FakeCallScreen 
            callerName={fakeCallConfig.callerName}
            delaySeconds={fakeCallConfig.delay}
            onEndCall={handleBack}
          />
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
      {!sosActive && !activeView.startsWith("fakecall") && (
        <BottomNav 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          isOnline={isOnline}
        />
      )}
      
      {/* SOS Flow Overlay */}
      <SOSFlow
        isActive={sosActive}
        countdownDuration={sosCountdownDuration}
        onCancel={handleSOSCancel}
        onComplete={handleSOSComplete}
        location={location}
        address={gpsLocation?.address}
        emergencyNumbers={getEmergencyNumbers()}
        emergencyContacts={profile?.emergencyContacts || []}
        isOnline={isOnline}
        userName={profile?.fullName}
        autoCalledAmbulance={autoCalledAmbulance}
        bloodGroup={profile?.bloodGroup}
        medicalConditions={profile?.medicalConditions}
        allergies={profile?.allergies}
        triggerType={sosTriggerType}
      />

      {/* Smart SOS Trigger Confirmation Overlay */}
      <SOSConfirmationOverlay
        isVisible={showSOSConfirmation}
        triggerType={sosTriggerType}
        detectedCommand={lastDetectedCommand}
        onConfirm={handleConfirmSmartTrigger}
        onCancel={handleCancelSmartTrigger}
        autoConfirmDelay={sosCountdownDuration}
        emergencyNumbers={{ ambulance: getEmergencyNumbers().ambulance }}
        userName={profile?.fullName}
        bloodGroup={profile?.bloodGroup}
        medicalConditions={profile?.medicalConditions}
        allergies={profile?.allergies}
        emergencyContacts={profile?.emergencyContacts || []}
      />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </main>
  )
}
