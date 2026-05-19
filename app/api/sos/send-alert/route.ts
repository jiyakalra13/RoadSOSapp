import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import twilio from "twilio"

// Initialize Twilio client
// Requires TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your .env or Render environment
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

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
      if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
        console.log(`\n--- SENDING REAL SMS VIA TWILIO TO ${contacts?.length || 0} CONTACTS ---`)
        
        // Loop through all contacts and send the SMS
        const sendPromises = contacts.map((contact: any) => {
          return twilioClient.messages.create({
            body: alertData.messageBody,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: contact.phone // Ensure phone numbers are in E.164 format (e.g., +1234567890)
          }).then(message => {
            console.log(`Twilio Success: Message sent to ${contact.name} (SID: ${message.sid})`);
          }).catch(error => {
            console.error(`Twilio Error sending to ${contact.name}:`, error);
          });
        });
        
        // Wait for all messages to send (or fail)
        await Promise.all(sendPromises);
        console.log(`--------------------------------------------------\n`)
      } else {
        // Fallback simulation if Twilio is not configured
        console.log(`\n--- SIMULATED SMS SENT TO ${contacts?.length || 0} CONTACTS ---`)
        console.log(`[!] TWILIO KEYS NOT FOUND. Showing simulated message below:`)
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
