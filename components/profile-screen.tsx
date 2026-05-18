"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Droplet, 
  AlertCircle, 
  Heart, 
  MapPin,
  Plus,
  Save,
  Trash2,
  Edit2,
  Pill,
  Car,
  Calendar,
  Globe
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import type { UserProfile } from "@/hooks/use-user-profile"
import { getCountryByCode } from "@/lib/countries"

interface ProfileScreenProps {
  onBack: () => void
  userProfile?: UserProfile | null
  onSaveProfile?: (profile: Partial<UserProfile>) => void
}

interface EmergencyContact {
  id: string
  name: string
  phone: string
  relationship: string
}

interface LocalProfile {
  name: string
  phone: string
  countryCode: string
  dateOfBirth: string
  bloodGroup: string
  allergies: string
  medicalConditions: string
  medications: string
  vehicleNumber: string
  vehicleModel: string
  emergencyContacts: EmergencyContact[]
}

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

export function ProfileScreen({ onBack, userProfile, onSaveProfile }: ProfileScreenProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<"info" | "medical" | "contacts">("info")
  
  // Initialize profile from userProfile prop
  const [profile, setProfile] = useState<LocalProfile>(() => ({
    name: userProfile?.fullName || "",
    phone: userProfile?.phone || "",
    countryCode: userProfile?.countryCode || "US",
    dateOfBirth: userProfile?.dateOfBirth || "",
    bloodGroup: userProfile?.bloodGroup || "",
    allergies: userProfile?.allergies || "",
    medicalConditions: userProfile?.medicalConditions || "",
    medications: userProfile?.medications || "",
    vehicleNumber: userProfile?.vehicleNumber || "",
    vehicleModel: userProfile?.vehicleModel || "",
    emergencyContacts: userProfile?.emergencyContacts || []
  }))

  // Get country info
  const country = getCountryByCode(profile.countryCode)

  // Update local profile when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setProfile({
        name: userProfile.fullName || "",
        phone: userProfile.phone || "",
        countryCode: userProfile.countryCode || "US",
        dateOfBirth: userProfile.dateOfBirth || "",
        bloodGroup: userProfile.bloodGroup || "",
        allergies: userProfile.allergies || "",
        medicalConditions: userProfile.medicalConditions || "",
        medications: userProfile.medications || "",
        vehicleNumber: userProfile.vehicleNumber || "",
        vehicleModel: userProfile.vehicleModel || "",
        emergencyContacts: userProfile.emergencyContacts || []
      })
    }
  }, [userProfile])

  const handleSave = () => {
    // Save to persistent storage via the hook
    if (onSaveProfile) {
      onSaveProfile({
        fullName: profile.name,
        phone: profile.phone,
        countryCode: profile.countryCode,
        dateOfBirth: profile.dateOfBirth,
        bloodGroup: profile.bloodGroup,
        allergies: profile.allergies,
        medicalConditions: profile.medicalConditions,
        medications: profile.medications,
        vehicleNumber: profile.vehicleNumber,
        vehicleModel: profile.vehicleModel,
        emergencyContacts: profile.emergencyContacts
      })
    }
    setIsEditing(false)
  }

  const addEmergencyContact = () => {
    const newContact: EmergencyContact = {
      id: Date.now().toString(),
      name: "",
      phone: "",
      relationship: ""
    }
    setProfile(prev => ({
      ...prev,
      emergencyContacts: [...prev.emergencyContacts, newContact]
    }))
  }

  const updateContact = (id: string, field: keyof EmergencyContact, value: string) => {
    setProfile(prev => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.map(c =>
        c.id === id ? { ...c, [field]: value } : c
      )
    }))
  }

  const removeContact = (id: string) => {
    setProfile(prev => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.filter(c => c.id !== id)
    }))
  }

  const callPhone = (phone: string) => {
    window.location.href = `tel:${phone}`
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] bg-background overflow-hidden">
      {/* Header */}
      <div className="bg-background border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center justify-between">
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
              <h1 className="text-base font-semibold text-foreground">Profile</h1>
              <p className="text-xs text-muted-foreground">Emergency info</p>
            </div>
          </div>
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            className="rounded-full h-8 text-xs"
          >
            {isEditing ? (
              <>
                <Save className="h-3.5 w-3.5 mr-1" />
                Save
              </>
            ) : (
              <>
                <Edit2 className="h-3.5 w-3.5 mr-1" />
                Edit
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border px-4 shrink-0">
        {[
          { id: "info" as const, label: "Personal" },
          { id: "medical" as const, label: "Medical" },
          { id: "contacts" as const, label: "Contacts" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 py-2.5 text-xs font-medium transition-colors",
              activeTab === tab.id 
                ? "text-primary border-b-2 border-primary" 
                : "text-muted-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {activeTab === "info" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Avatar */}
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-7 w-7 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-foreground truncate">
                  {profile.name || "Not set"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {country?.dialCode} {profile.phone || "No phone"}
                </p>
              </div>
            </div>

            {/* Personal Info */}
            <Card className="p-3 space-y-3">
              <ProfileField
                icon={User}
                label="Full Name"
                value={profile.name}
                isEditing={isEditing}
                onChange={(v) => setProfile(p => ({ ...p, name: v }))}
              />
              <ProfileField
                icon={Phone}
                label="Phone"
                value={profile.phone}
                isEditing={isEditing}
                onChange={(v) => setProfile(p => ({ ...p, phone: v }))}
              />
              <ProfileField
                icon={Calendar}
                label="Date of Birth"
                value={profile.dateOfBirth}
                isEditing={isEditing}
                onChange={(v) => setProfile(p => ({ ...p, dateOfBirth: v }))}
                type="date"
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Country</span>
                </div>
                <p className="text-sm text-foreground">{country?.name || profile.countryCode}</p>
              </div>
            </Card>

            {/* Vehicle Info */}
            <Card className="p-3 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Car className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Vehicle Information</span>
              </div>
              <ProfileField
                icon={Car}
                label="License Plate"
                value={profile.vehicleNumber}
                isEditing={isEditing}
                onChange={(v) => setProfile(p => ({ ...p, vehicleNumber: v }))}
              />
              <ProfileField
                icon={Car}
                label="Vehicle Model"
                value={profile.vehicleModel}
                isEditing={isEditing}
                onChange={(v) => setProfile(p => ({ ...p, vehicleModel: v }))}
              />
            </Card>
          </motion.div>
        )}

        {activeTab === "medical" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Blood Group */}
            <Card className="p-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Droplet className="h-4 w-4 text-emergency" />
                  <span className="text-sm font-medium text-foreground">Blood Group</span>
                </div>
                {isEditing ? (
                  <div className="flex flex-wrap gap-1.5">
                    {bloodGroups.map((group) => (
                      <Button
                        key={group}
                        variant={profile.bloodGroup === group ? "default" : "outline"}
                        size="sm"
                        onClick={() => setProfile(p => ({ ...p, bloodGroup: group }))}
                        className={cn(
                          "h-7 w-10 rounded-full text-xs",
                          profile.bloodGroup === group && "bg-emergency hover:bg-emergency/90"
                        )}
                      >
                        {group}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="inline-flex items-center px-2.5 py-1 bg-emergency/10 text-emergency rounded-full text-xs font-semibold">
                    {profile.bloodGroup || "Not set"}
                  </div>
                )}
              </div>
            </Card>

            {/* Medical Details */}
            <Card className="p-3 space-y-3">
              <ProfileField
                icon={AlertCircle}
                label="Allergies"
                value={profile.allergies}
                isEditing={isEditing}
                onChange={(v) => setProfile(p => ({ ...p, allergies: v }))}
              />
              <ProfileField
                icon={Heart}
                label="Medical Conditions"
                value={profile.medicalConditions}
                isEditing={isEditing}
                onChange={(v) => setProfile(p => ({ ...p, medicalConditions: v }))}
              />
              <ProfileField
                icon={Pill}
                label="Current Medications"
                value={profile.medications}
                isEditing={isEditing}
                onChange={(v) => setProfile(p => ({ ...p, medications: v }))}
              />
            </Card>
          </motion.div>
        )}

        {activeTab === "contacts" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {isEditing && profile.emergencyContacts.length < 3 && (
              <Button
                variant="outline"
                size="sm"
                onClick={addEmergencyContact}
                className="w-full h-9 text-xs"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Contact
              </Button>
            )}
            
            {profile.emergencyContacts.map((contact, index) => (
              <Card key={contact.id} className="p-3">
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Contact {index + 1}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeContact(contact.id)}
                        className="h-7 w-7 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Input
                      value={contact.name}
                      onChange={(e) => updateContact(contact.id, "name", e.target.value)}
                      placeholder="Name"
                      className="h-9 text-sm"
                    />
                    <Input
                      value={contact.phone}
                      onChange={(e) => updateContact(contact.id, "phone", e.target.value)}
                      placeholder="Phone"
                      className="h-9 text-sm"
                    />
                    <Input
                      value={contact.relationship}
                      onChange={(e) => updateContact(contact.id, "relationship", e.target.value)}
                      placeholder="Relationship"
                      className="h-9 text-sm"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => callPhone(contact.phone)}
                      className="h-9 w-9 rounded-full shrink-0"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

function ProfileField({
  icon: Icon,
  label,
  value,
  isEditing,
  onChange,
  type = "text"
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  isEditing: boolean
  onChange: (value: string) => void
  type?: "text" | "date"
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      {isEditing ? (
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={label}
          className="h-9 text-sm"
        />
      ) : (
        <p className="text-sm text-foreground">{value || "Not set"}</p>
      )}
    </div>
  )
}

function FeatureToggle({
  label,
  description,
  enabled
}: {
  label: string
  description: string
  enabled: boolean
}) {
  const [isEnabled, setIsEnabled] = useState(enabled)
  
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={() => setIsEnabled(!isEnabled)}
        className={cn(
          "w-10 h-5 rounded-full transition-colors relative",
          isEnabled ? "bg-primary" : "bg-muted"
        )}
      >
        <div className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
          isEnabled ? "translate-x-5 left-0" : "left-0.5"
        )} />
      </button>
    </div>
  )
}
