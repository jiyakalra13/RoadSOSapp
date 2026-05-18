"use client"

import { useState, useEffect, useCallback } from "react"
import type { Country } from "@/lib/countries"
import { getCountryByCode } from "@/lib/countries"

export interface UserProfile {
  // Personal Info
  fullName: string
  phone: string
  countryCode: string
  dateOfBirth: string
  
  // Medical Info
  bloodGroup: string
  allergies: string
  medicalConditions: string
  medications: string
  
  // Emergency Contacts
  emergencyContacts: EmergencyContact[]
  
  // Vehicle Info (optional)
  vehicleNumber?: string
  vehicleModel?: string
  
  // Preferences
  hasCompletedOnboarding: boolean
  createdAt: string
  updatedAt: string
}

export interface EmergencyContact {
  id: string
  name: string
  phone: string
  relationship: string
}

const STORAGE_KEY = "roadsos_user_profile"

const defaultProfile: UserProfile = {
  fullName: "",
  phone: "",
  countryCode: "US",
  dateOfBirth: "",
  bloodGroup: "",
  allergies: "",
  medicalConditions: "",
  medications: "",
  emergencyContacts: [],
  vehicleNumber: "",
  vehicleModel: "",
  hasCompletedOnboarding: false,
  createdAt: "",
  updatedAt: ""
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [country, setCountry] = useState<Country | undefined>(undefined)

  // Load profile from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile
        setProfile(parsed)
        setCountry(getCountryByCode(parsed.countryCode))
      } else {
        setProfile(null)
      }
    } catch {
      setProfile(null)
    }
    setIsLoading(false)
  }, [])

  // Save profile to localStorage
  const saveProfile = useCallback((newProfile: Partial<UserProfile>) => {
    const now = new Date().toISOString()
    const updated: UserProfile = {
      ...defaultProfile,
      ...profile,
      ...newProfile,
      updatedAt: now,
      createdAt: profile?.createdAt || now
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setProfile(updated)
    setCountry(getCountryByCode(updated.countryCode))
    
    return updated
  }, [profile])

  // Complete onboarding
  const completeOnboarding = useCallback((profileData: Partial<UserProfile>) => {
    return saveProfile({
      ...profileData,
      hasCompletedOnboarding: true
    })
  }, [saveProfile])

  // Clear profile (for testing/logout)
  const clearProfile = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setProfile(null)
    setCountry(undefined)
  }, [])

  // Get emergency numbers for current country
  const getEmergencyNumbers = useCallback(() => {
    if (!country) {
      // Default to US numbers
      return { police: "911", ambulance: "911", fire: "911", general: "911" }
    }
    return country.emergency
  }, [country])

  // Format phone with country code
  const formatPhoneWithCode = useCallback((phone: string) => {
    if (!country || !phone) return phone
    const cleanPhone = phone.replace(/\D/g, "")
    return `${country.dialCode} ${cleanPhone}`
  }, [country])

  return {
    profile,
    isLoading,
    country,
    saveProfile,
    completeOnboarding,
    clearProfile,
    getEmergencyNumbers,
    formatPhoneWithCode,
    hasCompletedOnboarding: profile?.hasCompletedOnboarding ?? false
  }
}
