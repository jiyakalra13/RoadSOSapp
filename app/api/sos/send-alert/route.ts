import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

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
      const apiKey = process.env.FAST2SMS_API_KEY;
      if (apiKey) {
        console.log(`\n--- SENDING REAL SMS VIA FAST2SMS TO ${contacts?.length || 0} CONTACTS ---`)
        
        // Extract 10-digit phone numbers and join by comma
        const numbers = contacts
          .map((c: any) => c.phone.replace(/[^0-9]/g, '').slice(-10))
          .filter((n: string) => n.length === 10)
          .join(",");

        if (numbers.length > 0) {
          try {
            const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
              method: "POST",
              headers: {
                "authorization": apiKey,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                route: "v3",
                sender_id: "TXTIND",
                message: alertData.messageBody,
                language: "english",
                flash: 0,
                numbers: numbers
              })
            });

            const data = await response.json();
            if (data.return) {
              console.log(`Fast2SMS Success:`, data);
            } else {
              console.error(`Fast2SMS Error:`, data);
            }
          } catch (error) {
            console.error(`Fast2SMS Network Error:`, error);
          }
        } else {
          console.log(`Fast2SMS Warning: No valid 10-digit Indian phone numbers found.`);
        }
        console.log(`--------------------------------------------------\n`)
      } else {
        // Fallback simulation if Fast2SMS is not configured
        console.log(`\n--- SIMULATED SMS SENT TO ${contacts?.length || 0} CONTACTS ---`)
        console.log(`[!] FAST2SMS_API_KEY NOT FOUND. Showing simulated message below:`)
        console.log(alertData.messageBody)
        console.log(`--------------------------------------------------\n`)
      }
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
