// Offline first aid database - cached locally for offline access
// This data is embedded in the app and works without any network connection

export interface FirstAidGuide {
  id: string
  title: string
  category: string
  keywords: string[]
  steps: string[]
  warning?: string
  callEmergency: boolean
}

export const offlineFirstAidGuides: FirstAidGuide[] = [
  {
    id: "bleeding",
    title: "Stop Severe Bleeding",
    category: "injury",
    keywords: ["bleeding", "blood", "cut", "wound", "laceration", "hemorrhage"],
    steps: [
      "Apply direct pressure with a clean cloth or bandage",
      "Elevate the injured area above the heart if possible",
      "Add more layers if blood soaks through - don't remove original",
      "Maintain pressure for at least 10 minutes",
      "If bleeding doesn't stop, call 911 immediately"
    ],
    warning: "Do not remove any objects embedded in the wound",
    callEmergency: true
  },
  {
    id: "burn",
    title: "Burn First Aid",
    category: "injury",
    keywords: ["burn", "scald", "fire", "hot", "steam", "chemical"],
    steps: [
      "Cool the burn with running cool water for 10-20 minutes",
      "Remove jewelry or tight items near the burn (before swelling)",
      "Do not break blisters - they protect against infection",
      "Cover loosely with a sterile, non-stick bandage",
      "Take over-the-counter pain medication if needed"
    ],
    warning: "Do not use ice, butter, or home remedies on burns. Seek help for burns larger than 3 inches or on face/joints.",
    callEmergency: true
  },
  {
    id: "cpr",
    title: "CPR (Adult)",
    category: "cardiac",
    keywords: ["cpr", "heart", "cardiac", "not breathing", "unconscious", "unresponsive", "pulse"],
    steps: [
      "Check responsiveness - tap shoulder and shout 'Are you okay?'",
      "Call 911 immediately or have someone call",
      "Place heel of hand on center of chest (between nipples)",
      "Push hard and fast - at least 2 inches deep",
      "100-120 compressions per minute (to beat of 'Stayin' Alive')",
      "If trained, give 2 rescue breaths after every 30 compressions",
      "Continue until help arrives or person starts breathing"
    ],
    warning: "If you're not trained in CPR, perform hands-only CPR (compressions without rescue breaths)",
    callEmergency: true
  },
  {
    id: "choking",
    title: "Choking (Adult)",
    category: "airway",
    keywords: ["choking", "can't breathe", "airway", "obstruction", "heimlich"],
    steps: [
      "Ask 'Are you choking?' - if they can't speak or cough, act immediately",
      "Stand behind the person, wrap your arms around their waist",
      "Make a fist with one hand, place it above their navel",
      "Grasp your fist with other hand, give quick upward thrusts",
      "Repeat until object is expelled or person becomes unconscious",
      "If unconscious, begin CPR and check mouth for object before breaths"
    ],
    warning: "If you are alone and choking, use a chair back or counter to give yourself abdominal thrusts",
    callEmergency: true
  },
  {
    id: "fracture",
    title: "Bone Fracture",
    category: "injury",
    keywords: ["fracture", "broken bone", "break", "snap", "bone injury"],
    steps: [
      "Keep the injured area completely still - do not try to realign",
      "Apply ice wrapped in cloth to reduce swelling (20 min on, 20 off)",
      "Elevate the injured limb if possible without causing more pain",
      "Immobilize with a splint if trained (padding + rigid support)",
      "Check circulation below injury (warmth, color, pulse)",
      "Seek immediate medical attention"
    ],
    warning: "Do not move the person if you suspect spine or neck injury. Wait for emergency services.",
    callEmergency: true
  },
  {
    id: "shock",
    title: "Treating Shock",
    category: "emergency",
    keywords: ["shock", "pale", "cold", "sweating", "weak pulse", "confusion"],
    steps: [
      "Call 911 immediately - shock is life-threatening",
      "Lay the person flat on their back",
      "Elevate legs about 12 inches (unless head/neck/spine injury suspected)",
      "Keep the person warm with blankets or coats",
      "Do not give them anything to eat or drink",
      "Monitor breathing and consciousness until help arrives"
    ],
    warning: "Signs of shock: pale/cool/clammy skin, rapid breathing, confusion, weakness",
    callEmergency: true
  },
  {
    id: "heart_attack",
    title: "Heart Attack",
    category: "cardiac",
    keywords: ["heart attack", "chest pain", "arm pain", "jaw pain", "shortness of breath"],
    steps: [
      "Call 911 immediately - time is critical",
      "Have the person sit or lie down in a comfortable position",
      "Loosen any tight clothing",
      "If not allergic, have them chew one adult aspirin (325mg)",
      "If they have prescribed nitroglycerin, help them take it",
      "Monitor breathing - be ready to perform CPR if needed",
      "Stay calm and reassure them while waiting for help"
    ],
    warning: "Heart attack signs: chest pressure/pain, pain in arms/jaw/neck/back, shortness of breath, cold sweat, nausea",
    callEmergency: true
  },
  {
    id: "stroke",
    title: "Stroke (FAST)",
    category: "neurological",
    keywords: ["stroke", "face drooping", "arm weakness", "speech", "slurred"],
    steps: [
      "F - Face: Ask them to smile. Does one side droop?",
      "A - Arms: Ask them to raise both arms. Does one drift down?",
      "S - Speech: Ask them to repeat a simple phrase. Is speech slurred?",
      "T - Time: If any symptoms, call 911 IMMEDIATELY",
      "Note the time symptoms started - critical for treatment",
      "Keep person comfortable, do not give food or drink",
      "If unconscious, place in recovery position"
    ],
    warning: "Every minute counts with stroke. Do not drive them yourself - call 911 for fastest care.",
    callEmergency: true
  },
  {
    id: "allergic_reaction",
    title: "Severe Allergic Reaction",
    category: "emergency",
    keywords: ["allergy", "allergic", "anaphylaxis", "swelling", "hives", "epinephrine", "epipen"],
    steps: [
      "Call 911 immediately if breathing difficulty or severe symptoms",
      "If they have an EpiPen, help them use it in outer thigh",
      "Have them lie down with legs elevated (unless breathing difficulty)",
      "Loosen tight clothing",
      "If vomiting, turn them on their side",
      "A second EpiPen dose may be needed after 5-15 minutes",
      "Stay with them until emergency services arrive"
    ],
    warning: "Anaphylaxis signs: difficulty breathing, swelling of throat/tongue, rapid pulse, dizziness, skin reactions",
    callEmergency: true
  },
  {
    id: "seizure",
    title: "Seizure",
    category: "neurological",
    keywords: ["seizure", "convulsion", "epilepsy", "shaking", "fits"],
    steps: [
      "Stay calm and time the seizure",
      "Clear the area of dangerous objects",
      "Cushion their head with something soft",
      "Turn them on their side to prevent choking",
      "Do NOT restrain them or put anything in their mouth",
      "Stay with them until fully conscious",
      "Call 911 if seizure lasts more than 5 minutes or they don't wake up"
    ],
    warning: "Call 911 if: first seizure, lasts >5 min, no return to consciousness, injury occurred, or person is pregnant",
    callEmergency: false
  },
  {
    id: "hypothermia",
    title: "Hypothermia",
    category: "environmental",
    keywords: ["cold", "hypothermia", "freezing", "shivering", "frostbite"],
    steps: [
      "Move person to warm, dry area",
      "Remove wet clothing and replace with dry layers",
      "Cover with blankets, including head (leave face exposed)",
      "Warm the center of body first (chest, neck, head, groin)",
      "Give warm beverages if conscious (no alcohol or caffeine)",
      "Apply warm compresses to neck, armpits, groin",
      "Do not rub or massage - handle gently"
    ],
    warning: "Call 911 for severe hypothermia: confusion, slurred speech, very cold skin, slow breathing",
    callEmergency: true
  },
  {
    id: "heatstroke",
    title: "Heat Stroke",
    category: "environmental",
    keywords: ["heat", "heatstroke", "hot", "overheating", "dehydration"],
    steps: [
      "Call 911 immediately - heat stroke is a medical emergency",
      "Move person to shade or air-conditioned area",
      "Remove excess clothing",
      "Cool rapidly: spray with cool water, use cold packs on neck/armpits/groin",
      "Fan while wetting skin with cool water",
      "Do NOT give fluids if unconscious",
      "Monitor body temperature - aim to cool to 101-102°F"
    ],
    warning: "Heat stroke signs: high body temp (104°F+), no sweating, confusion, rapid pulse, unconsciousness",
    callEmergency: true
  }
]

// Search function for offline first aid
export function searchOfflineFirstAid(query: string): FirstAidGuide | null {
  const lowerQuery = query.toLowerCase()
  
  // Direct ID match
  const directMatch = offlineFirstAidGuides.find(g => g.id === lowerQuery)
  if (directMatch) return directMatch
  
  // Keyword match
  const keywordMatch = offlineFirstAidGuides.find(guide =>
    guide.keywords.some(keyword => lowerQuery.includes(keyword))
  )
  if (keywordMatch) return keywordMatch
  
  // Title match
  const titleMatch = offlineFirstAidGuides.find(guide =>
    guide.title.toLowerCase().includes(lowerQuery)
  )
  if (titleMatch) return titleMatch
  
  return null
}

// Format guide for display
export function formatGuideResponse(guide: FirstAidGuide): string {
  let response = `**${guide.title}:**\n\n`
  
  guide.steps.forEach((step, index) => {
    response += `${index + 1}. ${step}\n`
  })
  
  if (guide.warning) {
    response += `\n⚠️ ${guide.warning}`
  }
  
  if (guide.callEmergency) {
    response += `\n\n🚨 Call 911 if situation is severe`
  }
  
  return response
}
