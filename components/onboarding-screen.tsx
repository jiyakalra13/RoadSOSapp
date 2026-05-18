"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  User,
  Phone,
  Droplet,
  AlertCircle,
  Heart,
  Pill,
  Car,
  ChevronRight,
  ChevronLeft,
  Check,
  Search,
  UserPlus,
  Shield,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { countries, type Country } from "@/lib/countries"
import type { UserProfile, EmergencyContact } from "@/hooks/use-user-profile"

interface OnboardingScreenProps {
  onComplete: (profile: Partial<UserProfile>) => void
}

type Step = "welcome" | "personal" | "medical" | "emergency" | "vehicle" | "review"

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

const relationships = ["Spouse", "Parent", "Sibling", "Child", "Friend", "Other"]

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState<Step>("welcome")
  const [searchQuery, setSearchQuery] = useState("")
  const [showCountryPicker, setShowCountryPicker] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState<Partial<UserProfile>>({
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
    vehicleModel: ""
  })

  const [newContact, setNewContact] = useState<Partial<EmergencyContact>>({
    name: "",
    phone: "",
    relationship: ""
  })

  const selectedCountry = useMemo(() => 
    countries.find(c => c.code === formData.countryCode) || countries[0],
    [formData.countryCode]
  )

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries
    const query = searchQuery.toLowerCase()
    return countries.filter(c => 
      c.name.toLowerCase().includes(query) ||
      c.dialCode.includes(query)
    )
  }, [searchQuery])

  const updateField = <K extends keyof UserProfile>(field: K, value: UserProfile[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addEmergencyContact = () => {
    if (newContact.name && newContact.phone && newContact.relationship) {
      const contact: EmergencyContact = {
        id: Date.now().toString(),
        name: newContact.name,
        phone: newContact.phone,
        relationship: newContact.relationship
      }
      updateField("emergencyContacts", [...(formData.emergencyContacts || []), contact])
      setNewContact({ name: "", phone: "", relationship: "" })
    }
  }

  const removeContact = (id: string) => {
    updateField(
      "emergencyContacts",
      (formData.emergencyContacts || []).filter(c => c.id !== id)
    )
  }

  const handleComplete = () => {
    onComplete(formData)
  }

  const steps: Step[] = ["welcome", "personal", "medical", "emergency", "vehicle", "review"]
  const currentStepIndex = steps.indexOf(step)

  const canProceed = () => {
    switch (step) {
      case "welcome":
        return true
      case "personal":
        return formData.fullName && formData.phone
      case "medical":
        return true // Medical info is optional
      case "emergency":
        return true // Emergency contacts are optional but recommended
      case "vehicle":
        return true // Vehicle info is optional
      case "review":
        return true
      default:
        return false
    }
  }

  const nextStep = () => {
    const currentIndex = steps.indexOf(step)
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1])
    }
  }

  const prevStep = () => {
    const currentIndex = steps.indexOf(step)
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1])
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress Bar */}
      {step !== "welcome" && (
        <div className="px-4 pt-4 pb-2 shrink-0">
          <div className="flex items-center gap-1">
            {steps.slice(1).map((s, i) => (
              <div
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i <= currentStepIndex - 1 ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            Step {currentStepIndex} of {steps.length - 1}
          </p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence mode="wait">
          {/* Welcome Step */}
          {step === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center"
            >
              <div className="h-20 w-20 rounded-full bg-emergency/10 flex items-center justify-center mb-6">
                <Shield className="h-10 w-10 text-emergency" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Welcome to RoadSOS
              </h1>
              <p className="text-sm text-muted-foreground mb-8 max-w-xs">
                Your emergency companion on the road. Let&apos;s set up your profile for faster emergency response.
              </p>
              <Button
                size="lg"
                onClick={nextStep}
                className="rounded-full px-8"
              >
                Get Started
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Personal Info Step */}
          {step === "personal" && (
            <motion.div
              key="personal"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Personal Information</h2>
                <p className="text-xs text-muted-foreground">This helps emergency services identify you</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Full Name *</label>
                  <Input
                    value={formData.fullName}
                    onChange={e => updateField("fullName", e.target.value)}
                    placeholder="Enter your full name"
                    className="h-11"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Country *</label>
                  <Button
                    variant="outline"
                    onClick={() => setShowCountryPicker(true)}
                    className="w-full h-11 justify-between font-normal"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{selectedCountry.flag}</span>
                      <span>{selectedCountry.name}</span>
                      <span className="text-muted-foreground">({selectedCountry.dialCode})</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Phone Number *</label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 bg-muted rounded-lg text-sm font-medium shrink-0">
                      {selectedCountry.flag} {selectedCountry.dialCode}
                    </div>
                    <Input
                      value={formData.phone}
                      onChange={e => updateField("phone", e.target.value)}
                      placeholder="Phone number"
                      type="tel"
                      className="h-11 flex-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Date of Birth</label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={e => updateField("dateOfBirth", e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Medical Info Step */}
          {step === "medical" && (
            <motion.div
              key="medical"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <div className="h-12 w-12 rounded-full bg-emergency/10 flex items-center justify-center mx-auto mb-3">
                  <Heart className="h-6 w-6 text-emergency" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Medical Information</h2>
                <p className="text-xs text-muted-foreground">Critical info for emergency responders</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                    <Droplet className="h-3.5 w-3.5 text-emergency" />
                    Blood Group
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {bloodGroups.map(group => (
                      <Button
                        key={group}
                        variant={formData.bloodGroup === group ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateField("bloodGroup", group)}
                        className={cn(
                          "h-9 text-xs",
                          formData.bloodGroup === group && "bg-emergency hover:bg-emergency/90"
                        )}
                      >
                        {group}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-warning" />
                    Allergies
                  </label>
                  <Input
                    value={formData.allergies}
                    onChange={e => updateField("allergies", e.target.value)}
                    placeholder="e.g., Penicillin, Peanuts, Latex"
                    className="h-11"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5 text-primary" />
                    Medical Conditions
                  </label>
                  <Input
                    value={formData.medicalConditions}
                    onChange={e => updateField("medicalConditions", e.target.value)}
                    placeholder="e.g., Diabetes, Asthma, Heart condition"
                    className="h-11"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                    <Pill className="h-3.5 w-3.5 text-muted-foreground" />
                    Current Medications
                  </label>
                  <Input
                    value={formData.medications}
                    onChange={e => updateField("medications", e.target.value)}
                    placeholder="e.g., Insulin, Aspirin"
                    className="h-11"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Emergency Contacts Step */}
          {step === "emergency" && (
            <motion.div
              key="emergency"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Emergency Contacts</h2>
                <p className="text-xs text-muted-foreground">People to notify in an emergency</p>
              </div>

              {/* Existing Contacts */}
              {(formData.emergencyContacts || []).map(contact => (
                <Card key={contact.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">{contact.relationship} - {contact.phone}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeContact(contact.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}

              {/* Add New Contact Form */}
              {(formData.emergencyContacts || []).length < 3 && (
                <Card className="p-3 space-y-3 border-dashed">
                  <p className="text-xs font-medium text-muted-foreground">Add Contact</p>
                  <Input
                    value={newContact.name}
                    onChange={e => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Contact name"
                    className="h-10"
                  />
                  <Input
                    value={newContact.phone}
                    onChange={e => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Phone number"
                    type="tel"
                    className="h-10"
                  />
                  <div className="grid grid-cols-3 gap-1.5">
                    {relationships.map(rel => (
                      <Button
                        key={rel}
                        variant={newContact.relationship === rel ? "default" : "outline"}
                        size="sm"
                        onClick={() => setNewContact(prev => ({ ...prev, relationship: rel }))}
                        className="h-8 text-[10px] px-2"
                      >
                        {rel}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addEmergencyContact}
                    disabled={!newContact.name || !newContact.phone || !newContact.relationship}
                    className="w-full h-9"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </Card>
              )}
            </motion.div>
          )}

          {/* Vehicle Info Step */}
          {step === "vehicle" && (
            <motion.div
              key="vehicle"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                  <Car className="h-6 w-6 text-blue-500" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Vehicle Information</h2>
                <p className="text-xs text-muted-foreground">Optional - helps in roadside emergencies</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Vehicle Number / License Plate</label>
                  <Input
                    value={formData.vehicleNumber}
                    onChange={e => updateField("vehicleNumber", e.target.value)}
                    placeholder="e.g., ABC 1234"
                    className="h-11"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Vehicle Model</label>
                  <Input
                    value={formData.vehicleModel}
                    onChange={e => updateField("vehicleModel", e.target.value)}
                    placeholder="e.g., Toyota Camry 2020"
                    className="h-11"
                  />
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground text-center mt-4">
                You can skip this step and add vehicle info later
              </p>
            </motion.div>
          )}

          {/* Review Step */}
          {step === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
                  <Check className="h-6 w-6 text-success" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">All Set!</h2>
                <p className="text-xs text-muted-foreground">Review your information</p>
              </div>

              <Card className="p-3 space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Personal</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Name</span>
                    <span className="text-xs font-medium text-foreground">{formData.fullName || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Phone</span>
                    <span className="text-xs font-medium text-foreground">
                      {selectedCountry.dialCode} {formData.phone || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Country</span>
                    <span className="text-xs font-medium text-foreground">
                      {selectedCountry.flag} {selectedCountry.name}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-3 space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Medical</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Blood Group</span>
                    <span className="text-xs font-medium text-emergency">{formData.bloodGroup || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Allergies</span>
                    <span className="text-xs font-medium text-foreground">{formData.allergies || "None"}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-3 space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Emergency Services</h3>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Police</span>
                    <span className="text-xs font-medium text-foreground">{selectedCountry.emergency.police}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Ambulance</span>
                    <span className="text-xs font-medium text-foreground">{selectedCountry.emergency.ambulance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Fire</span>
                    <span className="text-xs font-medium text-foreground">{selectedCountry.emergency.fire}</span>
                  </div>
                </div>
              </Card>

              {(formData.emergencyContacts || []).length > 0 && (
                <Card className="p-3 space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Emergency Contacts ({(formData.emergencyContacts || []).length})
                  </h3>
                  {(formData.emergencyContacts || []).map(contact => (
                    <div key={contact.id} className="flex justify-between">
                      <span className="text-xs text-muted-foreground">{contact.relationship}</span>
                      <span className="text-xs font-medium text-foreground">{contact.name}</span>
                    </div>
                  ))}
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      {step !== "welcome" && (
        <div className="px-4 py-4 border-t border-border shrink-0 bg-background">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={prevStep}
              className="flex-1 h-11"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            {step === "review" ? (
              <Button
                onClick={handleComplete}
                className="flex-1 h-11 bg-success hover:bg-success/90"
              >
                Complete Setup
                <Check className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex-1 h-11"
              >
                Continue
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Country Picker Modal */}
      <AnimatePresence>
        {showCountryPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="px-4 py-3 border-b border-border shrink-0">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowCountryPicker(false)
                      setSearchQuery("")
                    }}
                    className="h-9 w-9"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <h2 className="text-base font-semibold">Select Country</h2>
                </div>
                <div className="mt-3 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search countries..."
                    className="h-10 pl-9"
                    autoFocus
                  />
                </div>
              </div>

              {/* Country List */}
              <div className="flex-1 overflow-y-auto">
                {filteredCountries.map(country => (
                  <CountryItem
                    key={country.code}
                    country={country}
                    isSelected={formData.countryCode === country.code}
                    onSelect={() => {
                      updateField("countryCode", country.code)
                      setShowCountryPicker(false)
                      setSearchQuery("")
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CountryItem({
  country,
  isSelected,
  onSelect
}: {
  country: Country
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-accent transition-colors",
        isSelected && "bg-primary/5"
      )}
    >
      <span className="text-xl">{country.flag}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{country.name}</p>
        <p className="text-xs text-muted-foreground">
          Emergency: {country.emergency.general || country.emergency.police}
        </p>
      </div>
      <span className="text-sm text-muted-foreground shrink-0">{country.dialCode}</span>
      {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
    </button>
  )
}
