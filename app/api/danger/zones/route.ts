import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export interface DangerZone {
  id: string
  name: string
  lat: number
  lng: number
  radius: number // in meters
  riskLevel: "high" | "medium" | "low"
  confidence: number // prediction probability (0.0 to 1.0)
  trafficDensity: "high" | "moderate" | "low"
  poorLighting: boolean
  description: string
}

export const DANGER_ZONES: DangerZone[] = [
  {
    id: "zone-1",
    name: "NH-8 Intersection Junction",
    lat: 28.6139,
    lng: 77.2090,
    radius: 300,
    riskLevel: "high",
    confidence: 0.92,
    trafficDensity: "high",
    poorLighting: true,
    description: "Frequent multi-vehicle pileups due to abrupt merge lanes and poor illumination at night."
  },
  {
    id: "zone-2",
    name: "Western Express Curve",
    lat: 19.0760,
    lng: 72.8777,
    radius: 250,
    riskLevel: "high",
    confidence: 0.88,
    trafficDensity: "high",
    poorLighting: false,
    description: "Sharp blind turn with high speed limits, prone to skidding during rain."
  },
  {
    id: "zone-3",
    name: "Outer Ring Road Blind Corner",
    lat: 12.9716,
    lng: 77.5946,
    radius: 200,
    riskLevel: "high",
    confidence: 0.85,
    trafficDensity: "moderate",
    poorLighting: true,
    description: "Narrow curve with construction zones and blocked visibility."
  },
  {
    id: "zone-4",
    name: "Sector 62 Crossing",
    lat: 28.6273,
    lng: 77.3725,
    radius: 300,
    riskLevel: "high",
    confidence: 0.89,
    trafficDensity: "high",
    poorLighting: false,
    description: "Heavy commercial traffic and lack of clear lane markings."
  },
  {
    id: "zone-5",
    name: "Mock Simulator Danger Zone",
    lat: 0.0,
    lng: 0.0,
    radius: 1000, // Large radius for easy emulator testing
    riskLevel: "high",
    confidence: 0.95,
    trafficDensity: "low",
    poorLighting: true,
    description: "Default mock location for development environment testing."
  }
]

export async function GET() {
  return NextResponse.json({
    success: true,
    zones: DANGER_ZONES
  }, { status: 200 })
}
