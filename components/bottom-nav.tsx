"use client"

import { useState } from "react"
import { Home, Map, Settings, User, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
  isOnline: boolean
}

const navItems = [
  { id: "home", icon: Home, label: "Home" },
  { id: "services", icon: Map, label: "Services" },
  { id: "settings", icon: Settings, label: "Settings" },
  { id: "profile", icon: User, label: "Profile" },
]

export function BottomNav({ activeTab, onTabChange, isOnline }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
      
      {/* Offline indicator */}
      {!isOnline && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-warning text-warning-foreground px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-md">
          <WifiOff className="h-3 w-3" />
          Offline Mode
        </div>
      )}
    </nav>
  )
}
