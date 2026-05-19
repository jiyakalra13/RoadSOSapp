import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

// For this mock implementation, we log the alert and store it in a local JSON file.

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    
    const { userId, triggerType, location, time, contacts, status, messageBody } = payload
    
    const alertData = {
      id: `sos-${Date.now()}`,
      userId: userId || 'Anonymous',
      triggerType,
      location,
      time,
      contacts,
      status,
      messageBody,
      createdAt: new Date().toISOString()
    }
    
    console.log(`[SOS ALERT RECEIVED]`)
    console.log(`User ID: ${alertData.userId}`)
    console.log(`Trigger: ${alertData.triggerType}`)
    console.log(`Status: ${alertData.status}`)
    console.log(`Time: ${alertData.time}`)
    
    if (alertData.messageBody) {
      console.log(`\n--- SIMULATED SMS SENT TO ${contacts?.length || 0} CONTACTS ---`)
      console.log(alertData.messageBody)
      console.log(`--------------------------------------------------\n`)
    }
    
    // Store in a local JSON file to satisfy the "Store" requirement
    const dataDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    
    const fileLocation = path.join(dataDir, 'alerts.json')
    let existingAlerts = []
    if (fs.existsSync(fileLocation)) {
      const fileData = fs.readFileSync(fileLocation, 'utf-8')
      existingAlerts = JSON.parse(fileData)
    }
    
    existingAlerts.push(alertData)
    fs.writeFileSync(fileLocation, JSON.stringify(existingAlerts, null, 2))
    
    return NextResponse.json({ 
      success: true, 
      message: "Emergency alerts sent and stored successfully",
      alertId: alertData.id
    }, { status: 200 })
    
  } catch (error) {
    console.error("[SOS ALERT ERROR]", error)
    return NextResponse.json(
      { success: false, message: "Failed to process emergency alert" },
      { status: 500 }
    )
  }
}
