"use client"

import { motion } from "framer-motion"
import { 
  ArrowLeft, 
  Ambulance, 
  Shield, 
  Car,
  ChevronRight,
  MapPin
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface ServicesOverviewProps {
  onBack: () => void
  onSelectService: (service: "ambulance" | "police" | "vehicle") => void
  location: { lat: number; lng: number } | null
}

const services = [
  {
    id: "ambulance" as const,
    icon: Ambulance,
    title: "Hospitals",
    description: "Emergency medical services",
    count: "3 nearby",
    color: "bg-emergency",
    textColor: "text-emergency",
    bgColor: "bg-emergency/10"
  },
  {
    id: "police" as const,
    icon: Shield,
    title: "Police",
    description: "Safety assistance",
    count: "3 nearby",
    color: "bg-indigo-500",
    textColor: "text-indigo-500",
    bgColor: "bg-indigo-500/10"
  },
  {
    id: "vehicle" as const,
    icon: Car,
    title: "Vehicle",
    description: "Towing & repairs",
    count: "3 nearby",
    color: "bg-blue-500",
    textColor: "text-blue-500",
    bgColor: "bg-blue-500/10"
  }
]

export function ServicesOverview({ onBack, onSelectService, location }: ServicesOverviewProps) {
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
            <h1 className="text-base font-semibold text-foreground">Nearby Services</h1>
            <p className="text-xs text-muted-foreground">Find help near you</p>
          </div>
        </div>
      </div>

      {/* Map placeholder - compact */}
      <div className="h-28 bg-muted relative overflow-hidden shrink-0">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-5 w-5 mx-auto mb-1 text-muted-foreground/50" />
            {location && (
              <p className="text-[10px] text-muted-foreground">
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </p>
            )}
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-3 w-3 bg-primary rounded-full border-2 border-white shadow-lg" />
        </div>
      </div>

      {/* Services List */}
      <div className="flex-1 px-4 py-4 pb-24 space-y-3 overflow-y-auto">
        {services.map((service, index) => {
          const Icon = service.icon
          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className="p-3 cursor-pointer hover:shadow-md transition-all border-border/50"
                onClick={() => onSelectService(service.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
                    service.bgColor
                  )}>
                    <Icon className={cn("h-6 w-6", service.textColor)} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{service.title}</h3>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {service.description}
                    </p>
                    <div className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium mt-1",
                      service.bgColor,
                      service.textColor
                    )}>
                      {service.count}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
