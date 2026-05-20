import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { DANGER_ZONES } from "../zones/route"

export const dynamic = "force-dynamic"

// Haversine distance calculation in meters
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // meters
  const radLat1 = (lat1 * Math.PI) / 180
  const radLat2 = (lat2 * Math.PI) / 180
  const diffLat = ((lat2 - lat1) * Math.PI) / 180
  const diffLng = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(diffLat / 2) * Math.sin(diffLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) *
    Math.sin(diffLng / 2) * Math.sin(diffLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function POST(request: Request) {
  try {
    const { lat, lng } = await request.json()

    if (lat === undefined || lng === undefined) {
      return NextResponse.json(
        { success: false, message: "Latitude and Longitude are required." },
        { status: 400 }
      )
    }

    let detectedZone = null
    let minDistance = Infinity

    // Find the closest active danger zone the user is currently inside
    for (const zone of DANGER_ZONES) {
      const distance = calculateDistance(lat, lng, zone.lat, zone.lng)
      if (distance <= zone.radius) {
        if (distance < minDistance) {
          minDistance = distance
          detectedZone = zone
        }
      }
    }

    const timestamp = new Date().toISOString()
    const riskLevel = detectedZone ? detectedZone.riskLevel : "low"
    const confidence = detectedZone ? detectedZone.confidence : 0.12
    const zoneName = detectedZone ? detectedZone.name : "Safe Area"
    const inDangerZone = !!detectedZone

    // Prepare log record
    const logRecord = {
      timestamp,
      location: { lat, lng },
      riskLevel,
      confidence,
      zoneName,
      inDangerZone,
      distanceToZone: detectedZone ? Math.round(minDistance) : null
    }

    // Save logs to data/danger_logs.json
    try {
      const dataDir = path.join(process.cwd(), "data")
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }
      
      const filePath = path.join(dataDir, "danger_logs.json")
      let logs = []
      
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, "utf-8")
        try {
          logs = JSON.parse(fileContent)
          if (!Array.isArray(logs)) logs = []
        } catch {
          logs = []
        }
      }
      
      // Limit to last 500 logs to prevent file bloating
      logs.unshift(logRecord)
      if (logs.length > 500) {
        logs = logs.slice(0, 500)
      }
      
      fs.writeFileSync(filePath, JSON.stringify(logs, null, 2))
    } catch (err) {
      console.warn("Failed to write danger log:", err)
    }

    return NextResponse.json({
      success: true,
      inDangerZone,
      riskLevel,
      confidence,
      zoneName,
      log: logRecord
    }, { status: 200 })

  } catch (error) {
    console.error("[DANGER CHECK ERROR]", error)
    return NextResponse.json(
      { success: false, message: "Error performing danger check analysis" },
      { status: 500 }
    )
  }
}
