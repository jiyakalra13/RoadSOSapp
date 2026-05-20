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
  gender?: string
  
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
  gender: "",
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

  // Load profile from localStorage & sync with Python Backend
  useEffect(() => {
    let hasLocal = false
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile
        setProfile(parsed)
        setCountry(getCountryByCode(parsed.countryCode))
        hasLocal = true
      }
    } catch {
      // Ignore local storage error
    }

    // Try to sync with Python Backend
    fetch('/api/user/profile')
      .then(res => {
        if (!res.ok) throw new Error("No backend profile")
        return res.json()
      })
      .then((backendProfile: UserProfile) => {
        if (backendProfile && backendProfile.phone) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(backendProfile))
          setProfile(backendProfile)
          setCountry(getCountryByCode(backendProfile.countryCode))
          console.log("Successfully synced profile from Python backend!");
        }
      })
      .catch(err => {
        console.log("Python backend offline or empty, fell back to local storage.", err)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  // Save profile to localStorage and Backend
  const saveProfile = useCallback((newProfile: Partial<UserProfile>) => {
    const now = new Date().toISOString()
    const updated: UserProfile = {
      ...defaultProfile,
      ...profile,
      ...newProfile,
      updatedAt: now,
      createdAt: profile?.createdAt || now
    }
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setProfile(updated)
    setCountry(getCountryByCode(updated.countryCode))
    
    // Save to Backend (fire and forget)
    fetch('/api/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(err => console.error('Failed to save profile to backend:', err))
    
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
