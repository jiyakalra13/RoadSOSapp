import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const { contactName, contactPhone, userName, location } = payload
    
    if (!contactPhone) {
      return NextResponse.json({ success: false, message: "Contact phone missing" }, { status: 400 })
    }

    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) {
      console.log(`[!] FAST2SMS_API_KEY NOT FOUND. Simulated notify SMS:`)
      console.log(`Hi ${contactName}, ${userName || "Someone"} has added you as an emergency contact in the RoadSOS safety app.`)
      return NextResponse.json({ success: true, simulated: true })
    }

    let messageBody = `Hi ${contactName}, ${userName || "Someone"} has added you as an emergency contact in the RoadSOS safety app.`;
    
    if (location && location.lat && location.lng) {
      messageBody += `\nCurrent Location: https://maps.google.com/?q=${location.lat},${location.lng}`
    }

    const cleanPhone = contactPhone.replace(/[^0-9]/g, '').slice(-10);
    
    if (cleanPhone.length !== 10) {
      return NextResponse.json({ success: false, message: "Invalid phone number length" }, { status: 400 })
    }

    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        "authorization": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        route: "q",
        message: messageBody,
        flash: 0,
        numbers: cleanPhone
      })
    });

    const data = await response.json();
    if (data.return) {
      console.log(`Notify Contact Fast2SMS Success:`, data);
      return NextResponse.json({ success: true, data })
    } else {
      console.error(`Notify Contact Fast2SMS Error:`, data);
      return NextResponse.json({ success: false, message: "Fast2SMS error", data }, { status: 500 })
    }

  } catch (error) {
    console.error("[NOTIFY CONTACT ERROR]", error)
    return NextResponse.json(
      { success: false, message: "Failed to process notification" },
      { status: 500 }
    )
  }
}
