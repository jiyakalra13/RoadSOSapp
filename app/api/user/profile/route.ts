import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(request: Request) {
  try {
    const profile = await request.json()
    
    // Require phone as the unique identifier for now
    if (!profile.phone) {
      return NextResponse.json(
        { success: false, message: "Phone number is required to save profile" },
        { status: 400 }
      )
    }

    const dataDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    
    const fileLocation = path.join(dataDir, 'users.json')
    let users = []
    
    if (fs.existsSync(fileLocation)) {
      const fileData = fs.readFileSync(fileLocation, 'utf-8')
      try {
        users = JSON.parse(fileData)
      } catch (e) {
        users = []
      }
    }
    
    // Check if user already exists
    const existingIndex = users.findIndex((u: any) => u.phone === profile.phone)
    
    if (existingIndex >= 0) {
      // Update existing user
      users[existingIndex] = {
        ...users[existingIndex],
        ...profile,
        updatedAt: new Date().toISOString()
      }
    } else {
      // Create new user
      users.push({
        id: `user-${Date.now()}`,
        ...profile,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }
    
    fs.writeFileSync(fileLocation, JSON.stringify(users, null, 2))
    
    return NextResponse.json({ 
      success: true, 
      message: "Profile saved successfully"
    }, { status: 200 })
    
  } catch (error) {
    console.error("[PROFILE SAVE ERROR]", error)
    return NextResponse.json(
      { success: false, message: "Failed to save profile" },
      { status: 500 }
    )
  }
}
